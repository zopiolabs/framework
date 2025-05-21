import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/helpers.js";

/**
 * Standard CRUD operations
 */
const CRUD_OPERATIONS = [
  { name: "create", description: "Create new resources" },
  { name: "read", description: "Read/view resources" },
  { name: "update", description: "Update existing resources" },
  { name: "delete", description: "Delete resources" },
  { name: "list", description: "List/browse resources" },
  { name: "export", description: "Export resources" },
  { name: "import", description: "Import resources" }
];

/**
 * Get permissions configuration path
 */
function getPermissionsPath() {
  return path.join(process.cwd(), "config", "permissions.json");
}

/**
 * Load permissions configuration
 */
function loadPermissions() {
  const permissionsPath = getPermissionsPath();
  
  if (!fs.existsSync(permissionsPath)) {
    return {
      resources: {},
      roles: {},
      version: "1.0.0"
    };
  }
  
  try {
    const content = fs.readFileSync(permissionsPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Failed to load permissions: ${error.message}`);
    return {
      resources: {},
      roles: {},
      version: "1.0.0"
    };
  }
}

/**
 * Save permissions configuration
 */
function savePermissions(permissions) {
  const permissionsPath = getPermissionsPath();
  const configDir = path.dirname(permissionsPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2));
    return true;
  } catch (error) {
    logger.error(`Failed to save permissions: ${error.message}`);
    return false;
  }
}

/**
 * Add a resource with permissions
 */
function addResource(resourceName, operations = []) {
  const permissions = loadPermissions();
  const resourceKey = resourceName.toLowerCase();
  
  // Check if resource already exists
  if (permissions.resources[resourceKey]) {
    logger.warning(`Resource '${resourceKey}' already exists in permissions.`);
    return false;
  }
  
  // Use all operations if none specified
  const resourceOperations = operations.length > 0 
    ? operations 
    : CRUD_OPERATIONS.map(op => op.name);
  
  // Add resource with operations
  permissions.resources[resourceKey] = {
    name: resourceName,
    operations: resourceOperations.reduce((acc, op) => {
      acc[op] = { enabled: true };
      return acc;
    }, {})
  };
  
  // Save updated permissions
  if (savePermissions(permissions)) {
    logger.success(`Added resource '${resourceName}' with operations: ${resourceOperations.join(", ")}`);
    return true;
  }
  
  return false;
}

/**
 * Add a role with permissions
 */
function addRole(roleName, description = "") {
  const permissions = loadPermissions();
  const roleKey = roleName.toLowerCase();
  
  // Check if role already exists
  if (permissions.roles[roleKey]) {
    logger.warning(`Role '${roleKey}' already exists in permissions.`);
    return false;
  }
  
  // Add role
  permissions.roles[roleKey] = {
    name: roleName,
    description: description || `${roleName} role`,
    resources: {}
  };
  
  // Save updated permissions
  if (savePermissions(permissions)) {
    logger.success(`Added role '${roleName}'`);
    return true;
  }
  
  return false;
}

/**
 * Grant permissions to a role for a resource
 */
function grantPermission(roleName, resourceName, operations = []) {
  const permissions = loadPermissions();
  const roleKey = roleName.toLowerCase();
  const resourceKey = resourceName.toLowerCase();
  
  // Check if role exists
  if (!permissions.roles[roleKey]) {
    logger.error(`Role '${roleKey}' not found.`);
    return false;
  }
  
  // Check if resource exists
  if (!permissions.resources[resourceKey]) {
    logger.error(`Resource '${resourceKey}' not found.`);
    return false;
  }
  
  // Get available operations for the resource
  const availableOperations = Object.keys(permissions.resources[resourceKey].operations);
  
  // Use all operations if none specified
  const resourceOperations = operations.length > 0 
    ? operations.filter(op => availableOperations.includes(op))
    : availableOperations;
  
  // Initialize resource permissions for the role if needed
  if (!permissions.roles[roleKey].resources[resourceKey]) {
    permissions.roles[roleKey].resources[resourceKey] = {
      operations: {}
    };
  }
  
  // Grant operations
  for (const op of resourceOperations) {
    permissions.roles[roleKey].resources[resourceKey].operations[op] = { granted: true };
  }
  
  // Save updated permissions
  if (savePermissions(permissions)) {
    logger.success(`Granted ${resourceOperations.join(", ")} permissions on '${resourceName}' to role '${roleName}'`);
    return true;
  }
  
  return false;
}

/**
 * Revoke permissions from a role for a resource
 */
function revokePermission(roleName, resourceName, operations = []) {
  const permissions = loadPermissions();
  const roleKey = roleName.toLowerCase();
  const resourceKey = resourceName.toLowerCase();
  
  // Check if role exists
  if (!permissions.roles[roleKey]) {
    logger.error(`Role '${roleKey}' not found.`);
    return false;
  }
  
  // Check if resource exists
  if (!permissions.resources[resourceKey]) {
    logger.error(`Resource '${resourceKey}' not found.`);
    return false;
  }
  
  // Check if role has permissions for the resource
  if (!permissions.roles[roleKey].resources[resourceKey]) {
    logger.warning(`Role '${roleKey}' has no permissions for resource '${resourceKey}'.`);
    return false;
  }
  
  // Get granted operations for the resource
  const grantedOperations = Object.keys(
    permissions.roles[roleKey].resources[resourceKey].operations || {}
  );
  
  // Use all operations if none specified
  const operationsToRevoke = operations.length > 0 
    ? operations.filter(op => grantedOperations.includes(op))
    : grantedOperations;
  
  // Revoke operations
  for (const op of operationsToRevoke) {
    if (permissions.roles[roleKey].resources[resourceKey].operations[op]) {
      delete permissions.roles[roleKey].resources[resourceKey].operations[op];
    }
  }
  
  // Remove resource entry if no operations left
  if (Object.keys(permissions.roles[roleKey].resources[resourceKey].operations).length === 0) {
    delete permissions.roles[roleKey].resources[resourceKey];
  }
  
  // Save updated permissions
  if (savePermissions(permissions)) {
    logger.success(`Revoked ${operationsToRevoke.join(", ")} permissions on '${resourceName}' from role '${roleName}'`);
    return true;
  }
  
  return false;
}

/**
 * List resources with their operations
 */
function listResources() {
  const permissions = loadPermissions();
  const resources = permissions.resources;
  
  if (Object.keys(resources).length === 0) {
    logger.info("No resources defined in permissions.");
    return;
  }
  
  logger.title("Resources with Operations");
  
  for (const [key, resource] of Object.entries(resources)) {
    logger.info(`- ${resource.name} (${key})`);
    
    const operations = Object.keys(resource.operations || {});
    if (operations.length > 0) {
      logger.info(`  Operations: ${operations.join(", ")}`);
    } else {
      logger.info("  No operations defined.");
    }
  }
}

/**
 * List roles with their permissions
 */
function listRoles() {
  const permissions = loadPermissions();
  const roles = permissions.roles;
  
  if (Object.keys(roles).length === 0) {
    logger.info("No roles defined in permissions.");
    return;
  }
  
  logger.title("Roles with Permissions");
  
  for (const [key, role] of Object.entries(roles)) {
    logger.info(`- ${role.name} (${key})`);
    logger.info(`  Description: ${role.description || "No description"}`);
    
    const resources = Object.keys(role.resources || {});
    if (resources.length > 0) {
      logger.info("  Resources:");
      
      for (const resourceKey of resources) {
        const resource = permissions.resources[resourceKey];
        const resourceName = resource ? resource.name : resourceKey;
        
        const operations = Object.keys(role.resources[resourceKey].operations || {});
        logger.info(`    - ${resourceName}: ${operations.join(", ")}`);
      }
    } else {
      logger.info("  No resource permissions assigned.");
    }
  }
}

/**
 * Generate permissions for a CRUD resource
 */
function generatePermissions(resourceName) {
  // Add resource with all operations
  if (!addResource(resourceName)) {
    return false;
  }
  
  // Ensure basic roles exist
  addRole("Admin", "Administrator with full access");
  addRole("Manager", "Manager with create, read, update access");
  addRole("User", "Regular user with read access");
  
  // Grant permissions to roles
  grantPermission("Admin", resourceName);
  grantPermission("Manager", resourceName, ["create", "read", "update", "list"]);
  grantPermission("User", resourceName, ["read", "list"]);
  
  logger.success(`Generated permissions for resource '${resourceName}'`);
  
  // Generate permissions file for the resource
  generatePermissionsFile(resourceName);
  
  return true;
}

/**
 * Generate a permissions file for a resource
 */
function generatePermissionsFile(resourceName) {
  const permissions = loadPermissions();
  const resourceKey = resourceName.toLowerCase();
  
  // Check if resource exists
  if (!permissions.resources[resourceKey]) {
    logger.error(`Resource '${resourceKey}' not found.`);
    return false;
  }
  
  // Create resources directory if it doesn't exist
  const resourcesDir = path.join(process.cwd(), "resources", `${resourceKey}s`);
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }
  
  // Create permissions file
  const permissionsPath = path.join(resourcesDir, "permissions.js");
  const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  
  const permissionsContent = `/**
 * ${ResourceName} Permissions
 * Generated by Zopio CLI
 */
import { createPermissionChecker } from '@repo/crud/permissions';

// Define available operations
export const ${resourceKey}Operations = {
  create: 'create',
  read: 'read',
  update: 'update',
  delete: 'delete',
  list: 'list',
  export: 'export',
  import: 'import'
};

// Create permission checker for ${resourceName}
export const can${ResourceName} = createPermissionChecker('${resourceKey}');

// Permission check helpers
export const canCreate${ResourceName} = (user) => can${ResourceName}(user, ${resourceKey}Operations.create);
export const canRead${ResourceName} = (user) => can${ResourceName}(user, ${resourceKey}Operations.read);
export const canUpdate${ResourceName} = (user) => can${ResourceName}(user, ${resourceKey}Operations.update);
export const canDelete${ResourceName} = (user) => can${ResourceName}(user, ${resourceKey}Operations.delete);
export const canList${ResourceName}s = (user) => can${ResourceName}(user, ${resourceKey}Operations.list);
export const canExport${ResourceName}s = (user) => can${ResourceName}(user, ${resourceKey}Operations.export);
export const canImport${ResourceName}s = (user) => can${ResourceName}(user, ${resourceKey}Operations.import);

// Export default permission checker
export default can${ResourceName};
`;

  fs.writeFileSync(permissionsPath, permissionsContent);
  logger.success(`Created permissions file at ${permissionsPath}`);
  
  return true;
}

/**
 * Initialize permissions system
 */
function initPermissions() {
  const permissions = loadPermissions();
  
  // Add default roles if they don't exist
  addRole("Admin", "Administrator with full access");
  addRole("Manager", "Manager with create, read, update access");
  addRole("User", "Regular user with read access");
  
  // Save permissions
  if (savePermissions(permissions)) {
    logger.success("Initialized permissions system with default roles");
    return true;
  }
  
  return false;
}

const crudPermissionsCommand = new Command("crud-permissions")
  .description("Manage permissions for CRUD operations")
  .option("-i, --init", "Initialize permissions system")
  .option("-lr, --list-resources", "List resources with operations")
  .option("-lo, --list-roles", "List roles with permissions")
  .option("-ar, --add-resource <name>", "Add a resource")
  .option("-ao, --add-operations <operations>", "Operations to add (comma-separated)")
  .option("-rl, --add-role <name>", "Add a role")
  .option("-rd, --role-description <description>", "Role description")
  .option("-g, --grant", "Grant permissions to a role")
  .option("-r, --revoke", "Revoke permissions from a role")
  .option("-rn, --role-name <name>", "Role name for grant/revoke")
  .option("-rs, --resource-name <name>", "Resource name for grant/revoke")
  .option("-o, --operations <operations>", "Operations for grant/revoke (comma-separated)")
  .option("-gp, --generate <resource>", "Generate permissions for a resource")
  .action((options) => {
    if (options.init) {
      // Initialize permissions system
      initPermissions();
    } else if (options.listResources) {
      // List resources
      listResources();
    } else if (options.listRoles) {
      // List roles
      listRoles();
    } else if (options.addResource) {
      // Add resource
      const operations = options.addOperations ? options.addOperations.split(",") : [];
      addResource(options.addResource, operations);
    } else if (options.addRole) {
      // Add role
      addRole(options.addRole, options.roleDescription);
    } else if (options.grant && options.roleName && options.resourceName) {
      // Grant permissions
      const operations = options.operations ? options.operations.split(",") : [];
      grantPermission(options.roleName, options.resourceName, operations);
    } else if (options.revoke && options.roleName && options.resourceName) {
      // Revoke permissions
      const operations = options.operations ? options.operations.split(",") : [];
      revokePermission(options.roleName, options.resourceName, operations);
    } else if (options.generate) {
      // Generate permissions for a resource
      generatePermissions(options.generate);
    } else {
      // Show help if no valid options
      this.help();
    }
  });

export { crudPermissionsCommand };
