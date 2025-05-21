import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/helpers.js";

/**
 * Available validation libraries
 */
const VALIDATION_LIBRARIES = {
  "zod": {
    description: "TypeScript-first schema validation with static type inference",
    import: "import { z } from 'zod';",
    extension: ".zod.js"
  },
  "yup": {
    description: "Schema builder for runtime value parsing and validation",
    import: "import * as yup from 'yup';",
    extension: ".yup.js"
  },
  "joi": {
    description: "Object schema validation",
    import: "import Joi from 'joi';",
    extension: ".joi.js"
  },
  "ajv": {
    description: "JSON Schema validator",
    import: "import Ajv from 'ajv';",
    extension: ".schema.js"
  }
};

/**
 * Field type mapping to validation library types
 */
const TYPE_MAPPINGS = {
  "zod": {
    "string": "z.string()",
    "number": "z.number()",
    "boolean": "z.boolean()",
    "date": "z.date()",
    "email": "z.string().email()",
    "url": "z.string().url()",
    "uuid": "z.string().uuid()",
    "array": "z.array(z.any())",
    "object": "z.object({})"
  },
  "yup": {
    "string": "yup.string()",
    "number": "yup.number()",
    "boolean": "yup.boolean()",
    "date": "yup.date()",
    "email": "yup.string().email()",
    "url": "yup.string().url()",
    "uuid": "yup.string().uuid()",
    "array": "yup.array()",
    "object": "yup.object()"
  },
  "joi": {
    "string": "Joi.string()",
    "number": "Joi.number()",
    "boolean": "Joi.boolean()",
    "date": "Joi.date()",
    "email": "Joi.string().email()",
    "url": "Joi.string().uri()",
    "uuid": "Joi.string().uuid()",
    "array": "Joi.array()",
    "object": "Joi.object()"
  },
  "ajv": {
    "string": "{ type: 'string' }",
    "number": "{ type: 'number' }",
    "boolean": "{ type: 'boolean' }",
    "date": "{ type: 'string', format: 'date-time' }",
    "email": "{ type: 'string', format: 'email' }",
    "url": "{ type: 'string', format: 'uri' }",
    "uuid": "{ type: 'string', format: 'uuid' }",
    "array": "{ type: 'array', items: {} }",
    "object": "{ type: 'object', properties: {} }"
  }
};

/**
 * List available validation libraries
 */
function listValidationLibraries() {
  logger.title("Available Validation Libraries");
  
  for (const [name, library] of Object.entries(VALIDATION_LIBRARIES)) {
    logger.info(`- ${name}: ${library.description}`);
  }
}

/**
 * Load resource model to extract fields
 */
function loadResourceModel(resourceName) {
  const resourceNameLower = resourceName.toLowerCase();
  const modelPath = path.join(process.cwd(), "resources", `${resourceNameLower}s`, "model.js");
  
  if (!fs.existsSync(modelPath)) {
    logger.error(`Model not found for resource '${resourceName}' at ${modelPath}`);
    return null;
  }
  
  try {
    const modelContent = fs.readFileSync(modelPath, "utf8");
    
    // Extract fields using regex
    const fieldsMatch = modelContent.match(/fields\s*:\s*{([^}]*)}/s);
    if (!fieldsMatch) {
      logger.error(`Could not extract fields from model for resource '${resourceName}'`);
      return null;
    }
    
    const fieldsContent = fieldsMatch[1];
    const fieldRegex = /(\w+)\s*:\s*{([^}]*)}/g;
    let match;
    const fields = [];
    
    match = fieldRegex.exec(fieldsContent);
    while (match !== null) {
      const fieldName = match[1];
      const fieldProps = match[2];
      
      // Extract field type
      const typeMatch = fieldProps.match(/type\s*:\s*['"]([^'"]*)['"]/);
      const type = typeMatch ? typeMatch[1] : "string";
      
      // Extract required flag
      const requiredMatch = fieldProps.match(/required\s*:\s*(true|false)/);
      const required = requiredMatch ? requiredMatch[1] === "true" : false;
      
      fields.push({
        name: fieldName,
        type,
        required
      });
    }
    
    return {
      name: resourceName,
      fields
    };
  } catch (error) {
    logger.error(`Failed to load model for resource '${resourceName}': ${error.message}`);
    return null;
  }
}

/**
 * Generate validation schema for a resource using Zod
 */
function generateZodValidation(resource, options) {
  const ResourceName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
  const resourceNameLower = resource.name.toLowerCase();
  
  // Create validation directory
  const validationDir = path.join(process.cwd(), options.output, resourceNameLower);
  fs.mkdirSync(validationDir, { recursive: true });
  
  // Generate validation schema
  const validationPath = path.join(validationDir, `${resourceNameLower}.zod.js`);
  
  // Generate field validations
  const fieldValidations = resource.fields.map(field => {
    let validation = `  ${field.name}: ${TYPE_MAPPINGS.zod[field.type] || "z.string()"}`;
    
    // Add required constraint
    if (field.required) {
      validation += ".required()";
    } else {
      validation += ".optional()";
    }
    
    // Add specific field validations
    if (field.type === "string" && field.name.includes("name")) {
      validation += `.min(2, { message: "${field.name} must be at least 2 characters" })`;
    }
    
    if (field.type === "number") {
      validation += ".nonnegative()";
    }
    
    return validation;
  }).join(",\n");
  
  const validationContent = `/**
 * ${ResourceName} Validation Schema using Zod
 */
import { z } from 'zod';

// Base schema for validation
export const ${resourceNameLower}Schema = z.object({
${fieldValidations}
});

// Schema for creating a new ${ResourceName}
export const create${ResourceName}Schema = ${resourceNameLower}Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Schema for updating an existing ${ResourceName}
export const update${ResourceName}Schema = create${ResourceName}Schema.partial();

// Validation function for create
export function validateCreate${ResourceName}(data) {
  return create${ResourceName}Schema.safeParse(data);
}

// Validation function for update
export function validateUpdate${ResourceName}(data) {
  return update${ResourceName}Schema.safeParse(data);
}

// Export default schema
export default ${resourceNameLower}Schema;
`;

  fs.writeFileSync(validationPath, validationContent);
  logger.info(`Created Zod validation schema at ${validationPath}`);
  
  return true;
}

/**
 * Generate validation schema for a resource using Yup
 */
function generateYupValidation(resource, options) {
  const ResourceName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
  const resourceNameLower = resource.name.toLowerCase();
  
  // Create validation directory
  const validationDir = path.join(process.cwd(), options.output, resourceNameLower);
  fs.mkdirSync(validationDir, { recursive: true });
  
  // Generate validation schema
  const validationPath = path.join(validationDir, `${resourceNameLower}.yup.js`);
  
  // Generate field validations
  const fieldValidations = resource.fields.map(field => {
    let validation = `  ${field.name}: ${TYPE_MAPPINGS.yup[field.type] || "yup.string()"}`;
    
    // Add required constraint
    if (field.required) {
      validation += `.required("${field.name} is required")`;
    }
    
    // Add specific field validations
    if (field.type === "string" && field.name.includes("name")) {
      validation += `.min(2, "${field.name} must be at least 2 characters")`;
    }
    
    if (field.type === "number") {
      validation += ".min(0)";
    }
    
    return validation;
  }).join(",\n");
  
  const validationContent = `/**
 * ${ResourceName} Validation Schema using Yup
 */
import * as yup from 'yup';

// Base schema for validation
export const ${resourceNameLower}Schema = yup.object({
${fieldValidations}
});

// Schema for creating a new ${ResourceName}
export const create${ResourceName}Schema = ${resourceNameLower}Schema.omit([
  'id', 'createdAt', 'updatedAt'
]);

// Schema for updating an existing ${ResourceName}
export const update${ResourceName}Schema = create${ResourceName}Schema.partial();

// Validation function for create
export async function validateCreate${ResourceName}(data) {
  try {
    const validData = await create${ResourceName}Schema.validate(data, { abortEarly: false });
    return { success: true, data: validData };
  } catch (error) {
    return { 
      success: false, 
      errors: error.inner.reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {})
    };
  }
}

// Validation function for update
export async function validateUpdate${ResourceName}(data) {
  try {
    const validData = await update${ResourceName}Schema.validate(data, { abortEarly: false });
    return { success: true, data: validData };
  } catch (error) {
    return { 
      success: false, 
      errors: error.inner.reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {})
    };
  }
}

// Export default schema
export default ${resourceNameLower}Schema;
`;

  fs.writeFileSync(validationPath, validationContent);
  logger.info(`Created Yup validation schema at ${validationPath}`);
  
  return true;
}

/**
 * Generate validation schema for a resource using Joi
 */
function generateJoiValidation(resource, options) {
  const ResourceName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
  const resourceNameLower = resource.name.toLowerCase();
  
  // Create validation directory
  const validationDir = path.join(process.cwd(), options.output, resourceNameLower);
  fs.mkdirSync(validationDir, { recursive: true });
  
  // Generate validation schema
  const validationPath = path.join(validationDir, `${resourceNameLower}.joi.js`);
  
  // Generate field validations
  const fieldValidations = resource.fields.map(field => {
    let validation = `  ${field.name}: ${TYPE_MAPPINGS.joi[field.type] || "Joi.string()"}`;
    
    // Add required constraint
    if (field.required) {
      validation += '.required()';
    }
    
    // Add specific field validations
    if (field.type === "string" && field.name.includes("name")) {
      validation += `.min(2).message("${field.name} must be at least 2 characters")`;
    }
    
    if (field.type === "number") {
      validation += ".min(0)";
    }
    
    return validation;
  }).join(",\n");
  
  const validationContent = `/**
 * ${ResourceName} Validation Schema using Joi
 */
import Joi from 'joi';

// Base schema for validation
export const ${resourceNameLower}Schema = Joi.object({
${fieldValidations}
});

// Schema for creating a new ${ResourceName}
export const create${ResourceName}Schema = ${resourceNameLower}Schema.keys({
  id: Joi.forbidden(),
  createdAt: Joi.forbidden(),
  updatedAt: Joi.forbidden()
});

// Schema for updating an existing ${ResourceName}
export const update${ResourceName}Schema = create${ResourceName}Schema.fork(
  Object.keys(create${ResourceName}Schema.describe().keys),
  (schema) => schema.optional()
);

// Validation function for create
export function validateCreate${ResourceName}(data) {
  const result = create${ResourceName}Schema.validate(data, { abortEarly: false });
  
  if (result.error) {
    return {
      success: false,
      errors: result.error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {})
    };
  }
  
  return { success: true, data: result.value };
}

// Validation function for update
export function validateUpdate${ResourceName}(data) {
  const result = update${ResourceName}Schema.validate(data, { abortEarly: false });
  
  if (result.error) {
    return {
      success: false,
      errors: result.error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {})
    };
  }
  
  return { success: true, data: result.value };
}

// Export default schema
export default ${resourceNameLower}Schema;
`;

  fs.writeFileSync(validationPath, validationContent);
  logger.info(`Created Joi validation schema at ${validationPath}`);
  
  return true;
}

/**
 * Generate validation schema for a resource using JSON Schema (Ajv)
 */
function generateJsonSchemaValidation(resource, options) {
  const ResourceName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
  const resourceNameLower = resource.name.toLowerCase();
  
  // Create validation directory
  const validationDir = path.join(process.cwd(), options.output, resourceNameLower);
  fs.mkdirSync(validationDir, { recursive: true });
  
  // Generate validation schema
  const validationPath = path.join(validationDir, `${resourceNameLower}.schema.js`);
  
  // Generate field properties
  const fieldProperties = resource.fields.map(field => {
    let property = `    "${field.name}": ${TYPE_MAPPINGS.ajv[field.type] || "{ type: 'string' }"}`;
    
    // Add specific field validations
    if (field.type === "string" && field.name.includes("name")) {
      property = property.replace(/}$/, ', minLength: 2 }');
    }
    
    if (field.type === "number") {
      property = property.replace(/}$/, ', minimum: 0 }');
    }
    
    return property;
  }).join(",\n");
  
  // Generate required fields array
  const requiredFields = resource.fields
    .filter(field => field.required)
    .map(field => `"${field.name}"`);
  
  const requiredFieldsStr = requiredFields.length > 0
    ? `\n  required: [${requiredFields.join(", ")}],`
    : "";
  
  const validationContent = `/**
 * ${ResourceName} Validation Schema using JSON Schema (Ajv)
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize Ajv
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Base schema for validation
export const ${resourceNameLower}Schema = {
  type: "object",${requiredFieldsStr}
  properties: {
${fieldProperties}
  },
  additionalProperties: false
};

// Schema for creating a new ${ResourceName}
export const create${ResourceName}Schema = {
  ...${resourceNameLower}Schema,
  properties: {
    ...${resourceNameLower}Schema.properties
  }
};
// Remove id, createdAt, updatedAt from create schema
delete create${ResourceName}Schema.properties.id;
delete create${ResourceName}Schema.properties.createdAt;
delete create${ResourceName}Schema.properties.updatedAt;

// Schema for updating an existing ${ResourceName}
export const update${ResourceName}Schema = {
  ...create${ResourceName}Schema,
  required: [] // Make all fields optional for updates
};

// Compile validators
const validate${ResourceName} = ajv.compile(${resourceNameLower}Schema);
const validateCreate = ajv.compile(create${ResourceName}Schema);
const validateUpdate = ajv.compile(update${ResourceName}Schema);

// Validation function for create
export function validateCreate${ResourceName}(data) {
  const valid = validateCreate(data);
  
  if (!valid) {
    return {
      success: false,
      errors: validateCreate.errors.reduce((acc, error) => {
        const path = error.instancePath.replace(/^\\//g, '') || error.params.missingProperty;
        acc[path] = error.message;
        return acc;
      }, {})
    };
  }
  
  return { success: true, data };
}

// Validation function for update
export function validateUpdate${ResourceName}(data) {
  const valid = validateUpdate(data);
  
  if (!valid) {
    return {
      success: false,
      errors: validateUpdate.errors.reduce((acc, error) => {
        const path = error.instancePath.replace(/^\\//g, '') || error.params.missingProperty;
        acc[path] = error.message;
        return acc;
      }, {})
    };
  }
  
  return { success: true, data };
}

// Export default schema
export default ${resourceNameLower}Schema;
`;

  fs.writeFileSync(validationPath, validationContent);
  logger.info(`Created JSON Schema validation at ${validationPath}`);
  
  return true;
}

/**
 * Generate validation schema for a resource
 */
function generateValidation(resourceName, options) {
  // Load resource model
  const resource = loadResourceModel(resourceName);
  if (!resource) {
    return false;
  }
  
  // Create validation directory
  const validationDir = path.join(process.cwd(), options.output);
  fs.mkdirSync(validationDir, { recursive: true });
  
  // Generate validation based on library
  const library = options.library || "zod";
  
  switch (library) {
    case "zod":
      generateZodValidation(resource, options);
      break;
    case "yup":
      generateYupValidation(resource, options);
      break;
    case "joi":
      generateJoiValidation(resource, options);
      break;
    case "ajv":
      generateJsonSchemaValidation(resource, options);
      break;
    default:
      logger.error(`Unknown validation library: ${library}`);
      return false;
  }
  
  // Generate validation integration file
  generateValidationIntegration(resource, options);
  
  logger.success(`✅ Generated ${library} validation schema for '${resourceName}'`);
  return true;
}

/**
 * Generate validation integration file
 */
function generateValidationIntegration(resource, options) {
  const ResourceName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
  const resourceNameLower = resource.name.toLowerCase();
  
  // Create validation directory in the resource folder
  const resourceDir = path.join(process.cwd(), "resources", `${resourceNameLower}s`);
  const validationPath = path.join(resourceDir, "validation.js");
  
  const library = options.library || "zod";
  const extension = VALIDATION_LIBRARIES[library].extension;
  
  const validationContent = `/**
 * ${ResourceName} Validation Integration
 */
import { 
  validateCreate${ResourceName}, 
  validateUpdate${ResourceName} 
} from '../${options.output}/${resourceNameLower}/${resourceNameLower}${extension}';

// Middleware for validating create requests
export function validateCreate${ResourceName}Middleware(req, res, next) {
  const result = validateCreate${ResourceName}(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.errors
    });
  }
  
  // Attach validated data to request
  req.validatedData = result.data;
  next();
}

// Middleware for validating update requests
export function validateUpdate${ResourceName}Middleware(req, res, next) {
  const result = validateUpdate${ResourceName}(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.errors
    });
  }
  
  // Attach validated data to request
  req.validatedData = result.data;
  next();
}

// Client-side validation function for forms
export async function validate${ResourceName}Form(data, isEdit = false) {
  const validateFn = isEdit ? validateUpdate${ResourceName} : validateCreate${ResourceName};
  return validateFn(data);
}

// Export validation functions
export {
  validateCreate${ResourceName},
  validateUpdate${ResourceName}
};
`;

  fs.writeFileSync(validationPath, validationContent);
  logger.info(`Created validation integration at ${validationPath}`);
  
  return true;
}

/**
 * Generate all validation libraries for a resource
 */
function generateAllValidations(resourceName, options) {
  logger.title(`Generating all validation libraries for '${resourceName}'`);
  
  for (const library of Object.keys(VALIDATION_LIBRARIES)) {
    const libraryOptions = { ...options, library };
    generateValidation(resourceName, libraryOptions);
  }
  
  logger.success(`✅ Generated all validation libraries for '${resourceName}'`);
  return true;
}

const crudValidationCommand = new Command("crud-validation")
  .description("Generate validation schemas for CRUD resources")
  .option("-r, --resource <name>", "Resource name")
  .option("-l, --library <library>", "Validation library (zod, yup, joi, ajv)", "zod")
  .option("-a, --all", "Generate schemas for all supported libraries")
  .option("-o, --output <path>", "Output directory", "validations")
  .option("-ls, --list", "List available validation libraries")
  .action((options) => {
    if (options.list) {
      listValidationLibraries();
      return;
    }
    
    if (!options.resource) {
      logger.error("Resource name is required");
      return;
    }
    
    if (options.all) {
      generateAllValidations(options.resource, options);
    } else {
      generateValidation(options.resource, options);
    }
  });

export { crudValidationCommand, generateValidation };
