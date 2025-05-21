import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/helpers.js";

/**
 * Load and parse a schema file
 */
function loadSchema(schemaPath) {
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
  } catch (error) {
    logger.error(`Failed to load schema file: ${error.message}`);
    return null;
  }
}

/**
 * Validate schema structure
 */
function validateSchema(schema) {
  if (!schema) return false;
  if (!schema.name) {
    logger.error("Schema must have a 'name' property");
    return false;
  }
  if (!schema.fields || !Array.isArray(schema.fields)) {
    logger.error("Schema must have a 'fields' array");
    return false;
  }
  
  // Validate each field
  for (const field of schema.fields) {
    if (!field.name) {
      logger.error("Each field must have a 'name' property");
      return false;
    }
    if (!field.type) {
      logger.error(`Field '${field.name}' must have a 'type' property`);
      return false;
    }
  }
  
  return true;
}

/**
 * Generate model file from schema
 */
function generateModel(basePath, schema) {
  const modelPath = path.join(basePath, 'model.js');
  
  const fieldDefinitions = schema.fields.map(field => {
    const fieldDef = [`  ${field.name}: { type: '${field.type}'`];
    
    // Add additional field properties if present
    if (field.required) fieldDef.push(`, required: ${field.required}`);
    if (field.unique) fieldDef.push(`, unique: ${field.unique}`);
    if (field.default !== undefined) {
      const defaultValue = typeof field.default === 'string' 
        ? `'${field.default}'` 
        : field.default;
      fieldDef.push(`, default: ${defaultValue}`);
    }
    if (field.ref) fieldDef.push(`, ref: '${field.ref}'`);
    
    fieldDef.push(' }');
    return fieldDef.join('');
  }).join(',\n');
  
  const modelContent = `/**
 * ${schema.name} Model
 * Generated from schema
 */
export const ${schema.name}Model = {
  name: '${schema.name}',
  fields: {
${fieldDefinitions}
  },
  primaryKey: '${schema.primaryKey || 'id'}',
  timestamps: ${schema.timestamps !== false},
  ${schema.description ? `description: '${schema.description}',` : ''}
  ${schema.options ? `options: ${JSON.stringify(schema.options, null, 2)},` : ''}
};
`;

  fs.writeFileSync(modelPath, modelContent);
  logger.info(`Created model at ${modelPath}`);
}

/**
 * Generate data provider configuration from schema
 */
function generateDataProvider(basePath, schema) {
  const providerPath = path.join(basePath, 'provider.js');
  
  const resourceName = schema.name.charAt(0).toLowerCase() + schema.name.slice(1);
  
  const providerContent = `/**
 * ${schema.name} Data Provider
 * Generated from schema
 */
import { createDataProvider } from '@repo/data-base';
import { ${schema.name}Model } from './model.js';

export const ${resourceName}Provider = createDataProvider(
  '${schema.provider?.type || 'rest'}', 
  {
    apiUrl: '${schema.provider?.apiUrl || `/api/${resourceName}s`}',
    model: ${schema.name}Model,
    ${schema.provider?.options ? `options: ${JSON.stringify(schema.provider.options, null, 2)},` : ''}
  }
);
`;

  fs.writeFileSync(providerPath, providerContent);
  logger.info(`Created data provider at ${providerPath}`);
}

/**
 * Generate CRUD engine setup from schema
 */
function generateCrudEngine(basePath, schema) {
  const enginePath = path.join(basePath, 'engine.js');
  
  const resourceName = schema.name.charAt(0).toLowerCase() + schema.name.slice(1);
  
  const engineContent = `/**
 * ${schema.name} CRUD Engine
 * Generated from schema
 */
import { createCrudEngine } from '@repo/crud';
import { ${resourceName}Provider } from './provider.js';

export const ${resourceName}Engine = createCrudEngine({
  dataProvider: ${resourceName}Provider,
  enableAudit: ${schema.enableAudit !== false},
  enablePermissions: ${schema.enablePermissions !== false},
  ${schema.plugins ? `plugins: ${JSON.stringify(schema.plugins, null, 2)},` : ''}
});

// Export CRUD operations
export const get${schema.name}s = (params) => ${resourceName}Engine.getList(params);
export const get${schema.name} = (id) => ${resourceName}Engine.getOne({ id });
export const create${schema.name} = (data) => ${resourceName}Engine.create({ data });
export const update${schema.name} = (id, data) => ${resourceName}Engine.update({ id, data });
export const delete${schema.name} = (id) => ${resourceName}Engine.delete({ id });
`;

  fs.writeFileSync(enginePath, engineContent);
  logger.info(`Created CRUD engine at ${enginePath}`);
}

/**
 * Generate UI components from schema
 */
function generateUiComponents(basePath, schema, withI18n) {
  const componentsDir = path.join(basePath, 'components');
  fs.mkdirSync(componentsDir, { recursive: true });
  
  const resourceName = schema.name.charAt(0).toLowerCase() + schema.name.slice(1);
  
  // Generate List component
  const listPath = path.join(componentsDir, `${schema.name}List.jsx`);
  
  // Determine which fields to display in the list
  const listFields = schema.fields.filter(field => 
    field.showInList !== false && 
    !['password', 'file', 'image'].includes(field.type.toLowerCase())
  );
  
  const listContent = `/**
 * ${schema.name} List Component
 * Generated from schema
 */
import React from 'react';
import { useCrudTable } from '@repo/crud/ui';
import { get${schema.name}s } from '../engine.js';
${withI18n ? "import { useCrudTranslation } from '@repo/crud/ui/i18n';" : ""}

export function ${schema.name}List() {
  ${withI18n ? "const { t } = useCrudTranslation('crud');" : ""}
  const { 
    data, 
    loading, 
    error, 
    pagination, 
    sorting, 
    filters, 
    setPage, 
    setSort, 
    setFilter,
    selectedIds,
    setSelectedIds,
    isAllSelected,
    toggleSelectAll
  } = useCrudTable({
    fetchData: get${schema.name}s,
    defaultSorting: { field: '${schema.defaultSortField || 'createdAt'}', order: '${schema.defaultSortOrder || 'desc'}' }
  });

  if (loading) return <div>${withI18n ? "t('loading')" : "'Loading...'"}</div>;
  if (error) return <div>${withI18n ? "t('error')" : "'Error'"}: {error.message}</div>;

  return (
    <div className="crud-list">
      <h1>${withI18n ? `{t('${resourceName}.list.title')}` : `${schema.name} List`}</h1>
      
      {/* Filters would go here */}
      
      <table className="crud-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={toggleSelectAll}
              />
            </th>
${listFields.map(field => `            <th onClick={() => setSort('${field.name}')}>${withI18n ? `{t('${resourceName}.fields.${field.name}')}` : field.label || field.name}</th>`).join('\n')}
            <th>${withI18n ? `{t('actions')}` : 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(item.id)}
                  onChange={() => {
                    const newSelectedIds = selectedIds.includes(item.id)
                      ? selectedIds.filter(id => id !== item.id)
                      : [...selectedIds, item.id];
                    setSelectedIds(newSelectedIds);
                  }}
                />
              </td>
${listFields.map(field => {
    if (field.type === 'boolean') {
      return `              <td>{item.${field.name} ? '✓' : '✗'}</td>`;
    } 
    if (field.type === 'date') {
      return `              <td>{new Date(item.${field.name}).toLocaleDateString()}</td>`;
    } 
    if (field.type === 'object' || field.type === 'array') {
      return `              <td>{JSON.stringify(item.${field.name})}</td>`;
    } 
    return `              <td>{item.${field.name}}</td>`;
  }).join('\n')}
              <td className="crud-actions">
                <button className="view-btn">${withI18n ? `{t('view')}` : 'View'}</button>
                <button className="edit-btn">${withI18n ? `{t('edit')}` : 'Edit'}</button>
                <button className="delete-btn">${withI18n ? `{t('delete')}` : 'Delete'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination controls */}
      <div className="crud-pagination">
        <button 
          disabled={pagination.page === 1} 
          onClick={() => setPage(pagination.page - 1)}
        >
          ${withI18n ? `{t('previous')}` : 'Previous'}
        </button>
        <span>
          ${withI18n ? 
            `{t('pagination', { current: pagination.page, total: Math.ceil(pagination.total / pagination.perPage) })}` : 
            'Page {pagination.page} of {Math.ceil(pagination.total / pagination.perPage)}'}
        </span>
        <button 
          disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage)} 
          onClick={() => setPage(pagination.page + 1)}
        >
          ${withI18n ? '{t("next")}' : 'Next'}
        </button>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(listPath, listContent);
  logger.info(`Created List component at ${listPath}`);
  
  // Generate Form component
  const formPath = path.join(componentsDir, `${schema.name}Form.jsx`);
  
  // Function to generate form field based on field type
  const generateFormField = (field) => {
    const fieldName = field.name;
    const fieldLabel = withI18n ? `{t('${resourceName}.fields.${fieldName}')}` : field.label || fieldName;
    
    switch (field.type.toLowerCase()) {
      case 'boolean': {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <input
            type="checkbox"
            id="${fieldName}"
            name="${fieldName}"
            checked={values.${fieldName} || false}
            onChange={handleChange}
          />
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      case 'number': {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <input
            type="number"
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} || ''}
            onChange={handleChange}
            ${field.min !== undefined ? `min="${field.min}"` : ''}
            ${field.max !== undefined ? `max="${field.max}"` : ''}
            ${field.step ? `step="${field.step}"` : ''}
          />
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      case 'date': {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <input
            type="date"
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} ? new Date(values.${fieldName}).toISOString().split('T')[0] : ''}
            onChange={handleChange}
          />
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      case 'select':
      case 'enum': {
        const options = field.options || [];
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <select
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} || ''}
            onChange={handleChange}
          >
            <option value="">-- Select --</option>
            ${options.map(opt => `<option value="${opt.value || opt}">${opt.label || opt}</option>`).join('\n            ')}
          </select>
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      case 'textarea':
      case 'text': {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <textarea
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} || ''}
            onChange={handleChange}
            rows="${field.rows || 4}"
          ></textarea>
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      case 'password': {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <input
            type="password"
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} || ''}
            onChange={handleChange}
          />
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      case 'email': {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <input
            type="email"
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} || ''}
            onChange={handleChange}
          />
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
        
      default: {
        return `        <div className="form-field">
          <label htmlFor="${fieldName}">${fieldLabel}</label>
          <input
            type="text"
            id="${fieldName}"
            name="${fieldName}"
            value={values.${fieldName} || ''}
            onChange={handleChange}
          />
          {touched.${fieldName} && errors.${fieldName} && (
            <div className="error">{errors.${fieldName}}</div>
          )}
        </div>`;
      }
    }
  };
  
  // Determine which fields to display in the form
  const formFields = schema.fields.filter(field => field.showInForm !== false);
  
  const formContent = `/**
 * ${schema.name} Form Component
 * Generated from schema
 */
import React from 'react';
import { useCrudForm } from '@repo/crud/ui';
import { create${schema.name}, update${schema.name} } from '../engine.js';
${withI18n ? "import { useCrudTranslation } from '@repo/crud/ui/i18n';" : ""}

export function ${schema.name}Form({ initialData = {}, isEdit = false, onSuccess }) {
  ${withI18n ? "const { t } = useCrudTranslation('crud');" : ""}
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleSubmit, 
    isSubmitting,
    resetForm
  } = useCrudForm({
    schema: [
${formFields.map(field => {
    const fieldSchema = [`      { name: '${field.name}', type: '${field.type}'`];
    if (field.label) fieldSchema.push(`, label: ${withI18n ? `t('${resourceName}.fields.${field.name}')` : `'${field.label}'`}`);
    if (field.required) fieldSchema.push(`, required: ${field.required}`);
    if (field.validation) fieldSchema.push(`, validation: ${JSON.stringify(field.validation)}`);
    fieldSchema.push(' }');
    return fieldSchema.join('');
  }).join(',\n')}
    ],
    initial: initialData,
    onSubmit: async (data) => {
      try {
        if (isEdit) {
          await update${schema.name}(data.id, data);
        } else {
          await create${schema.name}(data);
        }
        
        if (onSuccess) {
          onSuccess(data);
        }
        
        if (!isEdit) {
          resetForm();
        }
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    }
  });

  return (
    <div className="crud-form">
      <h1>
        {isEdit 
          ? ${withI18n ? `t('${resourceName}.form.edit_title')` : `'Edit ${schema.name}'`}
          : ${withI18n ? `t('${resourceName}.form.create_title')` : `'Create ${schema.name}'`}
        }
      </h1>
      
      <form onSubmit={handleSubmit}>
${formFields.map(field => generateFormField(field)).join('\n\n')}
        
        <div className="form-actions">
          <button type="button" onClick={() => resetForm()}>
            ${withI18n ? `{t('reset')}` : 'Reset'}
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? ${withI18n ? `t('saving')` : `'Saving...'`}
              : ${withI18n ? `t('save')` : `'Save'`}
            }
          </button>
        </div>
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
 * ${schema.name} Components
 * Generated from schema
 */
export { ${schema.name}List } from './${schema.name}List.jsx';
export { ${schema.name}Form } from './${schema.name}Form.jsx';
`;

  fs.writeFileSync(indexPath, indexContent);
  logger.info(`Created components index at ${indexPath}`);
}

/**
 * Generate i18n resources from schema
 */
function generateI18n(schema) {
  // Get locales from the project's i18n configuration
  const locales = ['en', 'tr', 'es', 'de'];
  const resourceName = schema.name.charAt(0).toLowerCase() + schema.name.slice(1);
  
  for (const locale of locales) {
    const i18nDir = path.join(process.cwd(), 'dictionaries', locale);
    fs.mkdirSync(i18nDir, { recursive: true });
    
    const translations = {
      [`${resourceName}.list.title`]: locale === 'en' ? `${schema.name} List` :
                                     locale === 'tr' ? `${schema.name} Listesi` :
                                     locale === 'es' ? `Lista de ${schema.name}` :
                                     `${schema.name} Liste`,
      [`${resourceName}.form.create_title`]: locale === 'en' ? `Create ${schema.name}` :
                                           locale === 'tr' ? `${schema.name} Oluştur` :
                                           locale === 'es' ? `Crear ${schema.name}` :
                                           `${schema.name} Erstellen`,
      [`${resourceName}.form.edit_title`]: locale === 'en' ? `Edit ${schema.name}` :
                                         locale === 'tr' ? `${schema.name} Düzenle` :
                                         locale === 'es' ? `Editar ${schema.name}` :
                                         `${schema.name} Bearbeiten`,
    };
    
    // Add field translations from schema
    for (const field of schema.fields) {
      // Use field label if provided in schema
      const fieldLabel = field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1);
      
      let translatedField;
      if (locale === 'en') {
        translatedField = fieldLabel;
      } else if (locale === 'tr') {
        translatedField = getFieldTranslation(field.name, fieldLabel, 'tr');
      } else if (locale === 'es') {
        translatedField = getFieldTranslation(field.name, fieldLabel, 'es');
      } else {
        translatedField = getFieldTranslation(field.name, fieldLabel, 'de');
      }
      translations[`${resourceName}.fields.${field.name}`] = translatedField;
    }
    
    // Add custom translations from schema if provided
    if (schema.translations?.locale) {
      Object.assign(translations, schema.translations[locale]);
    }
    
    const i18nPath = path.join(i18nDir, `${resourceName}.json`);
    fs.writeFileSync(i18nPath, JSON.stringify(translations, null, 2));
    logger.info(`Created ${locale} translations at ${i18nPath}`);
  }
}

/**
 * Get field translation for common fields
 */
function getFieldTranslation(fieldName, defaultLabel, locale) {
  const commonTranslations = {
    id: { tr: 'Kimlik', es: 'Identificador', de: 'ID' },
    name: { tr: 'İsim', es: 'Nombre', de: 'Name' },
    title: { tr: 'Başlık', es: 'Título', de: 'Titel' },
    description: { tr: 'Açıklama', es: 'Descripción', de: 'Beschreibung' },
    email: { tr: 'E-posta', es: 'Correo electrónico', de: 'E-Mail' },
    password: { tr: 'Şifre', es: 'Contraseña', de: 'Passwort' },
    phone: { tr: 'Telefon', es: 'Teléfono', de: 'Telefon' },
    address: { tr: 'Adres', es: 'Dirección', de: 'Adresse' },
    status: { tr: 'Durum', es: 'Estado', de: 'Status' },
    createdAt: { tr: 'Oluşturulma Tarihi', es: 'Fecha de Creación', de: 'Erstellungsdatum' },
    updatedAt: { tr: 'Güncellenme Tarihi', es: 'Fecha de Actualización', de: 'Aktualisierungsdatum' }
  };
  
  return commonTranslations[fieldName]?.[locale] ?? defaultLabel;
}

/**
 * Generate a sample schema file
 */
function generateSampleSchema(schemaPath) {
  const sampleSchema = {
    name: "Product",
    description: "Product information",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        unique: true
      },
      {
        name: "name",
        type: "string",
        required: true,
        label: "Product Name"
      },
      {
        name: "description",
        type: "text",
        required: false
      },
      {
        name: "price",
        type: "number",
        required: true,
        min: 0
      },
      {
        name: "category",
        type: "select",
        options: ["Electronics", "Clothing", "Books", "Home"]
      },
      {
        name: "inStock",
        type: "boolean",
        default: true
      },
      {
        name: "releaseDate",
        type: "date"
      }
    ],
    primaryKey: "id",
    timestamps: true,
    defaultSortField: "name",
    defaultSortOrder: "asc",
    provider: {
      type: "rest",
      apiUrl: "/api/products"
    },
    enableAudit: true,
    enablePermissions: true,
    translations: {
      en: {
        "product.custom.key": "Custom Value"
      },
      tr: {
        "product.custom.key": "Özel Değer"
      }
    }
  };
  
  fs.writeFileSync(schemaPath, JSON.stringify(sampleSchema, null, 2));
  logger.success(`Created sample schema at ${schemaPath}`);
}

const crudSchemaCommand = new Command("crud-schema")
  .description("Generate CRUD resources from a schema file")
  .argument("<schema>", "Path to schema file or 'sample' to generate a sample schema")
  .option("-o, --output <path>", "Output directory for generated resources", "resources")
  .option("-i, --i18n", "Add internationalization support", true)
  .option("--no-ui", "Skip UI component generation", false)
  .action((schemaPath, options) => {
    // Generate sample schema if requested
    if (schemaPath === 'sample') {
      const samplePath = path.join(process.cwd(), 'schemas', 'sample-product.json');
      fs.mkdirSync(path.dirname(samplePath), { recursive: true });
      generateSampleSchema(samplePath);
      return;
    }
    
    // Resolve schema path
    const resolvedSchemaPath = path.isAbsolute(schemaPath) 
      ? schemaPath 
      : path.join(process.cwd(), schemaPath);
    
    // Load and validate schema
    const schema = loadSchema(resolvedSchemaPath);
    if (!validateSchema(schema)) {
      return;
    }
    
    // Create resource directory
    const resourceName = schema.name.charAt(0).toLowerCase() + schema.name.slice(1);
    const basePath = path.join(process.cwd(), options.output, `${resourceName}s`);
    fs.mkdirSync(basePath, { recursive: true });
    
    // Generate resources from schema
    generateModel(basePath, schema);
    generateDataProvider(basePath, schema);
    generateCrudEngine(basePath, schema);
    
    // Generate UI components if needed
    if (options.ui) {
      generateUiComponents(basePath, schema, options.i18n);
    }
    
    // Generate i18n resources if needed
    if (options.i18n) {
      generateI18n(schema);
    }
    
    logger.success(`✅ CRUD resources generated for '${schema.name}' from schema`);
  });

export { crudSchemaCommand };
