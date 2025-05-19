import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger, getI18nConfig, createFile } from "../utils/helpers.js";
import translationTemplate from "../templates/translation.js";
import i18nConfigTemplate from "../templates/i18n-config.js";

export const i18nCommand = new Command("i18n")
  .description("Manage internationalization for your Zopio project")
  .option("-a, --add <locale>", "Add a new locale")
  .option("-l, --list", "List all available locales")
  .option("-e, --extract", "Extract translation keys from project")
  .option("-c, --create <namespace>", "Create a new translation namespace")
  .action((options) => {
    const cwd = process.cwd();
    const i18nConfig = getI18nConfig(cwd);
    
    if (options.list) {
      logger.title("Available Locales");
      for (const locale of i18nConfig.locales) {
        logger.info(`- ${locale}`);
      }
      
      logger.info(`\nDefault locale: ${i18nConfig.defaultLocale}`);
      return;
    }
    
    if (options.add) {
      const newLocale = options.add.toLowerCase();
      
      if (i18nConfig.locales.includes(newLocale)) {
        logger.warning(`Locale '${newLocale}' already exists.`);
        return;
      }
      
      // Add to i18nConfig.ts
      const i18nConfigPath = path.join(cwd, 'i18nConfig.ts');
      if (fs.existsSync(i18nConfigPath)) {
        try {
          const content = fs.readFileSync(i18nConfigPath, 'utf8');
          const updatedContent = content.replace(
            /locales:\s*\[(.*?)\]/s,
            (match, localesStr) => {
              const locales = localesStr.split(',').map(l => l.trim());
              locales.push(`'${newLocale}'`);
              return `locales: [${locales.join(', ')}]`;
            }
          );
          
          fs.writeFileSync(i18nConfigPath, updatedContent);
        } catch (error) {
          logger.error(`Failed to update i18nConfig.ts: ${error.message}`);
        }
      } else {
        // Create new i18nConfig.ts
        const newConfig = i18nConfigTemplate({
          defaultLocale: i18nConfig.defaultLocale,
          locales: [...i18nConfig.locales, newLocale]
        });
        createFile(i18nConfigPath, newConfig);
      }
      
      // Create locale directories and files
      const dictionariesDir = path.join(cwd, 'dictionaries');
      const localesDir = path.join(cwd, 'locales');
      
      // Create in dictionaries directory (for next-international)
      if (fs.existsSync(dictionariesDir)) {
        const newLocaleDir = path.join(dictionariesDir, newLocale);
        if (!fs.existsSync(newLocaleDir)) {
          fs.mkdirSync(newLocaleDir, { recursive: true });
          
          // Copy common.json from default locale if it exists
          const defaultCommonPath = path.join(dictionariesDir, i18nConfig.defaultLocale, 'common.json');
          if (fs.existsSync(defaultCommonPath)) {
            const newCommonPath = path.join(newLocaleDir, 'common.json');
            fs.copyFileSync(defaultCommonPath, newCommonPath);
          } else {
            // Create a new common.json
            createFile(
              path.join(newLocaleDir, 'common.json'),
              translationTemplate('common', newLocale)
            );
          }
        }
      }
      
      // Create in locales directory (for next-intl)
      if (fs.existsSync(localesDir)) {
        const newLocalePath = path.join(localesDir, `${newLocale}.json`);
        if (!fs.existsSync(newLocalePath)) {
          // Copy from default locale if it exists
          const defaultLocalePath = path.join(localesDir, `${i18nConfig.defaultLocale}.json`);
          if (fs.existsSync(defaultLocalePath)) {
            fs.copyFileSync(defaultLocalePath, newLocalePath);
          } else {
            // Create a new locale file
            createFile(
              newLocalePath,
              JSON.stringify({ common: JSON.parse(translationTemplate('common', newLocale)) }, null, 2)
            );
          }
        }
      }
      
      logger.success(`Added new locale: ${newLocale}`);
      return;
    }
    
    if (options.create?.trim()) {
      const namespace = options.create?.trim().toLowerCase();
      
      // Create translations for each locale
      for (const locale of i18nConfig.locales) {
        // For dictionaries directory (next-international)
        const dictionariesDir = path.join(cwd, 'dictionaries');
        if (fs.existsSync(dictionariesDir)) {
          const localeDir = path.join(dictionariesDir, locale);
          if (!fs.existsSync(localeDir)) {
            fs.mkdirSync(localeDir, { recursive: true });
          }
          
          const namespacePath = path.join(localeDir, `${namespace}.json`);
          if (!fs.existsSync(namespacePath)) {
            createFile(namespacePath, translationTemplate(namespace, locale));
          }
        }
        
        // For locales directory (next-intl)
        const localesDir = path.join(cwd, 'locales');
        if (fs.existsSync(localesDir)) {
          const localePath = path.join(localesDir, `${locale}.json`);
          if (fs.existsSync(localePath)) {
            try {
              const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
              if (!localeData?.[namespace]) {
                localeData[namespace] = JSON.parse(translationTemplate(namespace, locale));
                fs.writeFileSync(localePath, JSON.stringify(localeData, null, 2));
              }
            } catch (error) {
              logger.error(`Failed to update ${locale}.json: ${error.message}`);
            }
          } else {
            createFile(
              localePath,
              JSON.stringify({ [namespace]: JSON.parse(translationTemplate(namespace, locale)) }, null, 2)
            );
          }
        }
      }
      
      logger.success(`Created translation namespace: ${namespace}`);
      return;
    }
    
    if (options.extract) {
      logger.info("Extracting translation keys from project...");
      logger.warning("This feature is not yet implemented.");
      return;
    }
    
    // If no options provided, show help
    this.help();
  });
