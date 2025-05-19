#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { generateCommand } from "./commands/generate.js";
import { i18nCommand } from "./commands/i18n.js";
import { configCommand } from "./commands/config.js";
import { jobsCommand } from "./commands/jobs.js";
import { logger, isZopioProject } from "./utils/helpers.js";
import { pluginManager } from "./utils/plugins.js";

// Create the main program
const program = new Command();

program
  .name("zopio")
  .description("Zopio CLI - Modular B2B Framework Toolkit")
  .version("0.1.0")
  .hook('preAction', (thisCommand, actionCommand) => {
    // Skip project check for init command
    if (actionCommand.name() === 'init') return;
    
    // Check if running in a Zopio project
    if (!isZopioProject() && actionCommand.name() !== 'help') {
      logger.warning('Not running in a Zopio project directory.');
      logger.info('Run "zopio init" to create a new project or navigate to an existing project directory.');
    }
  });

// Add a component command
program
  .command("component")
  .description("Generate a new React component")
  .argument("<name>", "Component name")
  .option("-i, --i18n", "Add internationalization support")
  .option("-p, --path <path>", "Custom path for the component", "components")
  .action((name, options) => {
    const componentName = name.charAt(0).toUpperCase() + name.slice(1);
    const componentPath = `${options.path}/${componentName}.jsx`;
    
    try {
      // Dynamic import for ESM compatibility
      import("./templates/component.js").then(module => {
        const componentTemplate = module.default;
        const content = componentTemplate(componentName, { withI18n: options.i18n });
        
        import("node:fs").then(fs => {
          import("node:path").then(path => {
            const fullPath = path.join(process.cwd(), componentPath);
            const dirPath = path.dirname(fullPath);
            
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            
            fs.writeFileSync(fullPath, content);
            logger.success(`Created component: ${chalk.bold(componentName)} at ${chalk.bold(componentPath)}`);
            
            // Create i18n namespace if needed
            if (options.i18n) {
              const namespace = componentName.toLowerCase();
              logger.info(`Run 'zopio i18n --create ${namespace}' to create translation files for this component.`);
            }
          });
        });
      });
    } catch (error) {
      logger.error(`Failed to create component: ${error.message}`);
    }
  });

// Add core commands
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(i18nCommand);
program.addCommand(configCommand);
program.addCommand(jobsCommand);

// Add plugin command to manage plugins
program
  .command("plugins")
  .description("Manage CLI plugins")
  .option("-l, --list", "List all installed plugins")
  .option("-i, --install <name>", "Install a plugin")
  .action(async (options) => {
    if (options.list) {
      logger.title("Installed Plugins");
      
      // Load plugins to ensure they're registered
      await pluginManager.loadPlugins();
      
      if (pluginManager.plugins.size === 0) {
        logger.info("No plugins installed.");
      } else {
        for (const [name, plugin] of pluginManager.plugins.entries()) {
          const commandCount = plugin.commands?.length || 0;
          logger.info(`- ${name} (${commandCount} commands)`);
        }
      }
    } else if (options.install) {
      logger.info(`Installing plugin: ${options.install}`);
      logger.warning("This feature is not yet implemented.");
      logger.info("To manually install a plugin, place it in one of these directories:");
      logger.info("- <project>/.zopio/plugins/");
      logger.info("- $HOME/.zopio/plugins/");
    } else {
      this.help();
    }
  });

// Load and register plugin commands
(async () => {
  try {
    const pluginCommands = await pluginManager.loadPlugins();
    
    // Add all plugin commands to the program
    for (const command of pluginCommands) {
      program.addCommand(command);
    }
    
    // Parse arguments after plugins are loaded
    program.parse();
  } catch (error) {
    logger.error(`Failed to load plugins: ${error.message}`);
    // Parse arguments even if plugins fail to load
    program.parse();
  }
})();
