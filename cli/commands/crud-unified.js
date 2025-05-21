import { Command } from "commander";
import { crudCommand } from "./crud.js";
import { crudSchemaCommand } from "./crud-schema.js";
import { dataProviderCommand } from "./data-provider.js";
import { crudUiCommand } from "./crud-ui.js";
import { crudPermissionsCommand } from "./crud-permissions.js";
import { crudTestingCommand, generateTests } from "./crud-testing.js";
import { crudValidationCommand, generateValidation } from "./crud-validation.js";
import { logger } from "../utils/helpers.js";

/**
 * Create a unified CRUD command that organizes all CRUD-related functionality
 * under a consistent namespace structure.
 */

// Create the main CRUD command
const unifiedCrudCommand = new Command("crud")
  .description("Unified CRUD operations toolkit")
  .addHelpText("after", `
Examples:
  zopio crud resource user --fields "name:string,email:string,age:number"
  zopio crud schema schemas/product.json
  zopio crud ui --template table --resource user
  zopio crud provider --add api --provider rest
  zopio crud permissions --generate user
  `);

// Create subcommands with aliases to the original commands
const resourceCommand = new Command("resource")
  .description("Generate CRUD resources (alias to the original crud command)")
  .argument("<n>", "Resource name (singular, e.g., 'user', 'product')")
  .option("-f, --fields <fields>", "Comma-separated list of fields with types (e.g., 'name:string,age:number')")
  .option("-p, --path <path>", "Custom path for the resource", "resources")
  .option("-i, --i18n", "Add internationalization support", true)
  .option("--no-ui", "Skip UI component generation", false)
  .action((name, options) => {
    // Forward to the original crud command
    crudCommand.action(name, options);
  });

const schemaCommand = new Command("schema")
  .description("Generate CRUD resources from a schema file")
  .argument("<schema>", "Path to schema file or 'sample' to generate a sample schema")
  .option("-o, --output <path>", "Output directory for generated resources", "resources")
  .option("-i, --i18n", "Add internationalization support", true)
  .option("--no-ui", "Skip UI component generation", false)
  .action((schema, options) => {
    // Forward to the original crud-schema command
    crudSchemaCommand.action(schema, options);
  });

const uiCommand = new Command("ui")
  .description("Generate CRUD UI templates")
  .option("-l, --list", "List available UI templates")
  .option("-t, --template <name>", "Template to generate")
  .option("-r, --resource <name>", "Resource name")
  .option("-a, --all", "Generate all templates for a resource")
  .option("-o, --output <path>", "Output directory", "components")
  .option("-i, --i18n", "Add internationalization support", true)
  .option("--typescript", "Generate TypeScript components", false)
  .action((options) => {
    // Forward to the original crud-ui command
    crudUiCommand.action(options);
  });

const providerCommand = new Command("provider")
  .description("Manage data providers for CRUD operations")
  .option("-l, --list", "List all configured data providers")
  .option("-t, --types", "List available data provider types")
  .option("-a, --add <name>", "Add a new data provider configuration")
  .option("-p, --provider <type>", "Provider type (rest, graphql, firebase, etc.)")
  .option("-o, --options <options>", "Provider options as comma-separated key=value pairs")
  .option("-u, --update-registry", "Update the provider registry")
  .option("-g, --generate <resource>", "Generate a CRUD resource using a specific provider")
  .option("--provider-name <name>", "Provider name to use with generate")
  .option("--path <path>", "Path for generated resources", "resources")
  .action((options) => {
    // Forward to the original data-provider command
    dataProviderCommand.action(options);
  });

const permissionsCommand = new Command("permissions")
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
    // Forward to the original crud-permissions command
    crudPermissionsCommand.action(options);
  });

// Create a testing command that forwards to the crud-testing command
const testingCommand = new Command("testing")
  .description("Generate tests for CRUD resources")
  .option("-r, --resource <name>", "Resource name")
  .option("-t, --types <types>", "Test types to generate (unit,integration,e2e)", "unit,integration")
  .option("-o, --output <path>", "Output directory", "tests")
  .option("-f, --framework <framework>", "Test framework to use")
  .option("-l, --list", "List available test types")
  .action((options) => {
    // Forward to the crud-testing command
    crudTestingCommand.action(options);
  });

// Add validation command
const validationCommand = new Command("validation")
  .description("Generate validation schemas for CRUD resources")
  .option("-r, --resource <name>", "Resource name")
  .option("-l, --library <library>", "Validation library (zod, yup, joi, ajv)", "zod")
  .option("-a, --all", "Generate schemas for all supported libraries")
  .option("-o, --output <path>", "Output directory", "validations")
  .option("-ls, --list", "List available validation libraries")
  .action((options) => {
    // Forward to the crud-validation command
    crudValidationCommand.action(options);
  });

// Add all subcommands to the unified command
unifiedCrudCommand
  .addCommand(resourceCommand)
  .addCommand(schemaCommand)
  .addCommand(uiCommand)
  .addCommand(providerCommand)
  .addCommand(permissionsCommand)
  .addCommand(testingCommand)
  .addCommand(validationCommand);

export { unifiedCrudCommand };
