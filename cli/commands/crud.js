import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/helpers.js";

/**
 * Parse field definitions from a string format
 * Example: "name:string,age:number,isActive:boolean"
 */
function parseFields(fieldsString) {
  return fieldsString.split(',').map(field => {
    const [name, type = 'string'] = field.trim().split(':');
    return { name, type };
  });
}

/**
 * Generate default fields based on resource name
 */
function getDefaultFields(resourceName) {
  return [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'createdAt', type: 'date' },
    { name: 'updatedAt', type: 'date' }
  ];
}

/**
 * Generate model file
 */
function generateModel(basePath, ResourceName, fields) {
  const modelPath = path.join(basePath, 'model.js');
  
  const fieldDefinitions = fields.map(field => 
    `  ${field.name}: { type: '${field.type}' }`
  ).join(',\n');
  
  const modelContent = `/**
 * ${ResourceName} Model
 */
export const ${ResourceName}Model = {
  name: '${ResourceName}',
  fields: {
${fieldDefinitions}
  },
  primaryKey: 'id',
  timestamps: true
};
`;

  fs.writeFileSync(modelPath, modelContent);
  logger.info(`Created model at ${modelPath}`);
}

/**
 * Generate data provider configuration
 */
function generateDataProvider(basePath, resourceName, ResourceName) {
  const providerPath = path.join(basePath, 'provider.js');
  
  const providerContent = `/**
 * ${ResourceName} Data Provider
 */
import { createDataProvider } from '@repo/data-base';
import { ${ResourceName}Model } from './model.js';

export const ${resourceName}Provider = createDataProvider('rest', {
  apiUrl: '/api/${resourceName}s',
  model: ${ResourceName}Model
});
`;

  fs.writeFileSync(providerPath, providerContent);
  logger.info(`Created data provider at ${providerPath}`);
}

/**
 * Generate CRUD engine setup
 */
function generateCrudEngine(basePath, resourceName, ResourceName) {
  const enginePath = path.join(basePath, 'engine.js');
  
  const engineContent = `/**
 * ${ResourceName} CRUD Engine
 */
import { createCrudEngine } from '@repo/crud';
import { ${resourceName}Provider } from './provider.js';

export const ${resourceName}Engine = createCrudEngine({
  dataProvider: ${resourceName}Provider,
  enableAudit: true,
  enablePermissions: true
});

// Export CRUD operations
export const get${ResourceName}s = (params) => ${resourceName}Engine.getList(params);
export const get${ResourceName} = (id) => ${resourceName}Engine.getOne({ id });
export const create${ResourceName} = (data) => ${resourceName}Engine.create({ data });
export const update${ResourceName} = (id, data) => ${resourceName}Engine.update({ id, data });
export const delete${ResourceName} = (id) => ${resourceName}Engine.delete({ id });
`;

  fs.writeFileSync(enginePath, engineContent);
  logger.info(`Created CRUD engine at ${enginePath}`);
}

/**
 * Generate UI components
 */
function generateUiComponents(basePath, resourceName, ResourceName, fields, withI18n) {
  const componentsDir = path.join(basePath, 'components');
  fs.mkdirSync(componentsDir, { recursive: true });
  
  // Generate List component
  const listPath = path.join(componentsDir, `${ResourceName}List.jsx`);
  const listContent = `/**
 * ${ResourceName} List Component
 */
import React from 'react';
import { useCrudTable } from '@repo/crud/ui';
import { get${ResourceName}s } from '../engine.js';
${withI18n ? "import { useCrudTranslation } from '@repo/crud/ui/i18n';" : ""}

export function ${ResourceName}List() {
  ${withI18n ? "const { t } = useCrudTranslation('crud');" : ""}
  const { data, loading, error, pagination, sorting, filters, setPage, setSort, setFilter } = useCrudTable({
    fetchData: get${ResourceName}s,
    defaultSorting: { field: 'createdAt', order: 'desc' }
  });

  if (loading) return <div>${withI18n ? "t('loading')" : "'Loading...'"}</div>;
  if (error) return <div>${withI18n ? "t('error')" : "'Error'"}: {error.message}</div>;

  return (
    <div>
      <h1>${withI18n ? `{t('${resourceName}.list.title')}` : `${ResourceName} List`}</h1>
      <table>
        <thead>
          <tr>
${fields.map(field => `            <th>${withI18n ? `{t('${resourceName}.fields.${field.name}')}` : field.name}</th>`).join('\n')}
            <th>${withI18n ? `{t('actions')}` : 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
${fields.map(field => `              <td>{item.${field.name}}</td>`).join('\n')}
              <td>
                <button>${withI18n ? `{t('view')}` : 'View'}</button>
                <button>${withI18n ? `{t('edit')}` : 'Edit'}</button>
                <button>${withI18n ? `{t('delete')}` : 'Delete'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination controls would go here */}
    </div>
  );
}
`;

  fs.writeFileSync(listPath, listContent);
  logger.info(`Created List component at ${listPath}`);
  
  // Generate Form component
  const formPath = path.join(componentsDir, `${ResourceName}Form.jsx`);
  const formContent = `/**
 * ${ResourceName} Form Component
 */
import React from 'react';
import { useCrudForm } from '@repo/crud/ui';
import { create${ResourceName}, update${ResourceName} } from '../engine.js';
${withI18n ? "import { useCrudTranslation } from '@repo/crud/ui/i18n';" : ""}

export function ${ResourceName}Form({ initialData = {}, isEdit = false }) {
  ${withI18n ? "const { t } = useCrudTranslation('crud');" : ""}
  const { values, errors, touched, handleChange, handleSubmit, isSubmitting } = useCrudForm({
    schema: [
${fields.map(field => `      { name: '${field.name}', type: '${field.type}', label: ${withI18n ? `t('${resourceName}.fields.${field.name}')` : `'${field.name}'`} }`).join(',\n')}
    ],
    initial: initialData,
    onSubmit: async (data) => {
      if (isEdit) {
        await update${ResourceName}(data.id, data);
      } else {
        await create${ResourceName}(data);
      }
    }
  });

  return (
    <div>
      <h1>
        {isEdit 
          ? ${withI18n ? `t('${resourceName}.form.edit_title')` : `'Edit ${ResourceName}'`}
          : ${withI18n ? `t('${resourceName}.form.create_title')` : `'Create ${ResourceName}'`}
        }
      </h1>
      
      <form onSubmit={handleSubmit}>
${fields.map(field => `        <div>
          <label htmlFor="${field.name}">${withI18n ? `{t('${resourceName}.fields.${field.name}')}` : field.name}</label>
          <input
            type="${field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}"
            id="${field.name}"
            name="${field.name}"
            value={values.${field.name} || ''}
            onChange={handleChange}
          />
          {touched.${field.name} && errors.${field.name} && (
            <div className="error">{errors.${field.name}}</div>
          )}
        </div>`).join('\n')}
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? ${withI18n ? `t('saving')` : `'Saving...'`}
            : ${withI18n ? `t('save')` : `'Save'`}
          }
        </button>
      </form>
    </div>
  );
}
`;

  fs.writeFileSync(formPath, formContent);
  logger.info(`Created Form component at ${formPath}`);
  
  // Generate index file to export all components
  const indexPath = path.join(componentsDir, 'index.js');
  const indexContent = `/**
 * ${ResourceName} Components
 */
export { ${ResourceName}List } from './${ResourceName}List.jsx';
export { ${ResourceName}Form } from './${ResourceName}Form.jsx';
`;

  fs.writeFileSync(indexPath, indexContent);
  logger.info(`Created components index at ${indexPath}`);
}

/**
 * Generate i18n resources
 */
function generateI18n(resourceName, ResourceName, fields) {
  // Get locales from the project's i18n configuration
  const locales = ['en', 'tr', 'es', 'de'];
  
  for (const locale of locales) {
    const i18nDir = path.join(process.cwd(), 'dictionaries', locale);
    fs.mkdirSync(i18nDir, { recursive: true });
    
    const translations = {
      [`${resourceName}.list.title`]: locale === 'en' ? `${ResourceName} List` :
                                     locale === 'tr' ? `${ResourceName} Listesi` :
                                     locale === 'es' ? `Lista de ${ResourceName}` :
                                     `${ResourceName} Liste`,
      [`${resourceName}.form.create_title`]: locale === 'en' ? `Create ${ResourceName}` :
                                           locale === 'tr' ? `${ResourceName} Oluştur` :
                                           locale === 'es' ? `Crear ${ResourceName}` :
                                           `${ResourceName} Erstellen`,
      [`${resourceName}.form.edit_title`]: locale === 'en' ? `Edit ${ResourceName}` :
                                         locale === 'tr' ? `${ResourceName} Düzenle` :
                                         locale === 'es' ? `Editar ${ResourceName}` :
                                         `${ResourceName} Bearbeiten`,
    };
    
    // Add field translations
    for (const field of fields) {
      translations[`${resourceName}.fields.${field.name}`] = 
        locale === 'en' ? field.name.charAt(0).toUpperCase() + field.name.slice(1) :
        locale === 'tr' ? getFieldTranslation(field.name, 'tr') :
        locale === 'es' ? getFieldTranslation(field.name, 'es') :
        getFieldTranslation(field.name, 'de');
    }
    
    const i18nPath = path.join(i18nDir, `${resourceName}.json`);
    fs.writeFileSync(i18nPath, JSON.stringify(translations, null, 2));
    logger.info(`Created ${locale} translations at ${i18nPath}`);
  }
}

/**
 * Get field translation for common fields
 */
function getFieldTranslation(fieldName, locale) {
  const translations = {
    id: { tr: 'Kimlik', es: 'Identificador', de: 'ID' },
    name: { tr: 'İsim', es: 'Nombre', de: 'Name' },
    description: { tr: 'Açıklama', es: 'Descripción', de: 'Beschreibung' },
    createdAt: { tr: 'Oluşturulma Tarihi', es: 'Fecha de Creación', de: 'Erstellungsdatum' },
    updatedAt: { tr: 'Güncellenme Tarihi', es: 'Fecha de Actualización', de: 'Aktualisierungsdatum' }
  };
  
  return translations[fieldName]?.[locale] || fieldName;
}

export const crudCommand = new Command("crud")
  .description("Generate CRUD resources")
  .argument("<n>", "Resource name (singular, e.g., 'user', 'product')")
  .option("-f, --fields <fields>", "Comma-separated list of fields with types (e.g., 'name:string,age:number')")
  .option("-p, --path <path>", "Custom path for the resource", "resources")
  .option("-i, --i18n", "Add internationalization support", true)
  .option("--no-ui", "Skip UI component generation", false)
  .action((name, options) => {
    // Normalize name (singular, camelCase for vars, PascalCase for components)
    const resourceName = name.toLowerCase();
    const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
    const resourcesName = `${resourceName}s`; // Simple pluralization
    
    // Parse fields
    const fields = options.fields ? parseFields(options.fields) : getDefaultFields(resourceName);
    
    // Create directories
    const basePath = path.join(process.cwd(), options.path, resourcesName);
    fs.mkdirSync(basePath, { recursive: true });
    
    // Generate model
    generateModel(basePath, ResourceName, fields);
    
    // Generate data provider configuration
    generateDataProvider(basePath, resourceName, ResourceName);
    
    // Generate CRUD engine setup
    generateCrudEngine(basePath, resourceName, ResourceName);
    
    // Generate UI components if needed
    if (options.ui) {
      generateUiComponents(basePath, resourceName, ResourceName, fields, options.i18n);
    }
    
    // Generate i18n resources if needed
    if (options.i18n) {
      generateI18n(resourceName, ResourceName, fields);
    }
    
    logger.success(`✅ CRUD resources generated for '${ResourceName}'`);
  });
