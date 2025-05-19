import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Plugin system for Zopio CLI
 * Allows extending the CLI with custom commands and functionality
 */
export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.commands = [];
  }

  /**
   * Load plugins from the project and user directories
   */
  async loadPlugins() {
    try {
      // Load built-in plugins
      await this.loadBuiltInPlugins();
      
      // Load project plugins
      await this.loadProjectPlugins();
      
      // Load user plugins
      await this.loadUserPlugins();
      
      return this.commands;
    } catch (error) {
      logger.error(`Failed to load plugins: ${error.message}`);
      return [];
    }
  }

  /**
   * Load built-in plugins
   */
  async loadBuiltInPlugins() {
    const builtInPluginsDir = path.join(__dirname, '..', 'plugins');
    
    if (fs.existsSync(builtInPluginsDir)) {
      const pluginFiles = fs.readdirSync(builtInPluginsDir)
        .filter(file => file.endsWith('.js'));
      
      for (const pluginFile of pluginFiles) {
        try {
          const pluginPath = path.join(builtInPluginsDir, pluginFile);
          const plugin = await import(pluginPath);
          
          if (plugin.default && typeof plugin.default === 'function') {
            const pluginName = path.basename(pluginFile, '.js');
            this.registerPlugin(pluginName, plugin.default);
          }
        } catch (error) {
          logger.error(`Failed to load built-in plugin ${pluginFile}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Load plugins from the current project
   */
  async loadProjectPlugins() {
    const projectPluginsDir = path.join(process.cwd(), '.zopio', 'plugins');
    
    if (fs.existsSync(projectPluginsDir)) {
      const pluginFiles = fs.readdirSync(projectPluginsDir)
        .filter(file => file.endsWith('.js'));
      
      for (const pluginFile of pluginFiles) {
        try {
          const pluginPath = path.join(projectPluginsDir, pluginFile);
          const plugin = await import(pluginPath);
          
          if (plugin.default && typeof plugin.default === 'function') {
            const pluginName = path.basename(pluginFile, '.js');
            this.registerPlugin(pluginName, plugin.default);
          }
        } catch (error) {
          logger.error(`Failed to load project plugin ${pluginFile}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Load plugins from the user's home directory
   */
  async loadUserPlugins() {
    const userHome = process.env.HOME || process.env.USERPROFILE;
    const userPluginsDir = path.join(userHome, '.zopio', 'plugins');
    
    if (fs.existsSync(userPluginsDir)) {
      const pluginFiles = fs.readdirSync(userPluginsDir)
        .filter(file => file.endsWith('.js'));
      
      for (const pluginFile of pluginFiles) {
        try {
          const pluginPath = path.join(userPluginsDir, pluginFile);
          const plugin = await import(pluginPath);
          
          if (plugin.default && typeof plugin.default === 'function') {
            const pluginName = path.basename(pluginFile, '.js');
            this.registerPlugin(pluginName, plugin.default);
          }
        } catch (error) {
          logger.error(`Failed to load user plugin ${pluginFile}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(name, initFunction) {
    if (this.plugins.has(name)) {
      logger.warning(`Plugin '${name}' is already registered. Skipping.`);
      return;
    }
    
    try {
      const commands = initFunction();
      this.plugins.set(name, { name, commands });
      
      if (Array.isArray(commands)) {
        this.commands.push(...commands);
      }
      
      logger.info(`Loaded plugin: ${name}`);
    } catch (error) {
      logger.error(`Failed to initialize plugin '${name}': ${error.message}`);
    }
  }
}

// Export a singleton instance
export const pluginManager = new PluginManager();
