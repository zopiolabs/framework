import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/helpers.js";

/**
 * Available UI templates
 */
const UI_TEMPLATES = {
  "table": {
    description: "Data table with sorting, filtering, and pagination",
    files: ["Table.jsx", "TableHeader.jsx", "TableRow.jsx", "TablePagination.jsx", "TableFilter.jsx"]
  },
  "form": {
    description: "Form with validation and field types",
    files: ["Form.jsx", "FormField.jsx", "FormActions.jsx", "FormValidation.js"]
  },
  "detail": {
    description: "Detail view with tabs and related data",
    files: ["Detail.jsx", "DetailHeader.jsx", "DetailTabs.jsx", "DetailRelated.jsx"]
  },
  "dashboard": {
    description: "Dashboard with metrics and recent items",
    files: ["Dashboard.jsx", "DashboardMetrics.jsx", "DashboardRecent.jsx", "DashboardChart.jsx"]
  },
  "wizard": {
    description: "Multi-step wizard for complex forms",
    files: ["Wizard.jsx", "WizardStep.jsx", "WizardNavigation.jsx", "WizardContext.js"]
  },
  "kanban": {
    description: "Kanban board for status-based views",
    files: ["Kanban.jsx", "KanbanColumn.jsx", "KanbanCard.jsx", "KanbanContext.js"]
  }
};

/**
 * List available UI templates
 */
function listTemplates() {
  logger.title("Available CRUD UI Templates");
  
  for (const [name, template] of Object.entries(UI_TEMPLATES)) {
    logger.info(`- ${name}: ${template.description}`);
    logger.info(`  Components: ${template.files.join(", ")}`);
  }
}

/**
 * Generate a UI template
 */
function generateTemplate(templateName, resourceName, options) {
  // Check if template exists
  if (!UI_TEMPLATES[templateName]) {
    logger.error(`Template '${templateName}' not found. Use --list to see available templates.`);
    return false;
  }
  
  const template = UI_TEMPLATES[templateName];
  const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), options.output || "components", resourceName, templateName);
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Generate each component file
  for (const file of template.files) {
    const componentPath = path.join(outputDir, file);
    const componentContent = generateComponent(templateName, file, ResourceName, options);
    
    fs.writeFileSync(componentPath, componentContent);
    logger.info(`Created ${file} at ${componentPath}`);
  }
  
  // Generate index file
  const indexPath = path.join(outputDir, "index.js");
  const indexContent = `/**
 * ${ResourceName} ${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Components
 */
${template.files.map(file => {
  const componentName = path.basename(file, path.extname(file));
  return `export { default as ${ResourceName}${componentName} } from './${file}';`;
}).join('\n')}

// Export default component
export { default } from './${template.files[0]}';
`;
  
  fs.writeFileSync(indexPath, indexContent);
  logger.info(`Created index.js at ${indexPath}`);
  
  logger.success(`✅ Generated ${templateName} UI template for '${ResourceName}'`);
  return true;
}

/**
 * Generate a component based on template and file
 */
function generateComponent(templateName, fileName, resourceName, options) {
  const withI18n = options.i18n !== false;
  const withTS = options.typescript === true;
  const fileExt = path.extname(fileName);
  const componentName = path.basename(fileName, fileExt);
  
  // Common imports based on options
  const imports = [
    "import React from 'react';",
    withI18n ? "import { useCrudTranslation } from '@repo/crud/ui/i18n';" : "",
    withTS ? "import type { FC, ReactNode } from 'react';" : ""
  ].filter(Boolean).join('\n');
  
  // Component props based on template and file
  let props = "";
  let componentType = "";
  if (withTS) {
    switch (templateName) {
      case "table":
        if (componentName === "Table") {
          props = `\ninterface ${resourceName}TableProps {\n  data: any[];\n  loading?: boolean;\n  error?: Error | null;\n  onRowClick?: (item: any) => void;\n}\n`;
          componentType = `: FC<${resourceName}TableProps>`;
        } else if (componentName === "TableRow") {
          props = `\ninterface ${resourceName}TableRowProps {\n  item: any;\n  onClick?: (item: any) => void;\n}\n`;
          componentType = `: FC<${resourceName}TableRowProps>`;
        }
        break;
      case "form":
        if (componentName === "Form") {
          props = `\ninterface ${resourceName}FormProps {\n  initialData?: any;\n  onSubmit: (data: any) => void;\n  isEdit?: boolean;\n}\n`;
          componentType = `: FC<${resourceName}FormProps>`;
        }
        break;
      // Add more cases for other templates
    }
  }
  
  // Generate component content based on template and file
  let content = "";
  switch (templateName) {
    case "table":
      content = generateTableComponent(componentName, resourceName, withI18n);
      break;
    case "form":
      content = generateFormComponent(componentName, resourceName, withI18n);
      break;
    case "detail":
      content = generateDetailComponent(componentName, resourceName, withI18n);
      break;
    case "dashboard":
      content = generateDashboardComponent(componentName, resourceName, withI18n);
      break;
    case "wizard":
      content = generateWizardComponent(componentName, resourceName, withI18n);
      break;
    case "kanban":
      content = generateKanbanComponent(componentName, resourceName, withI18n);
      break;
    default:
      content = `// Default component content\nreturn <div>${resourceName} ${componentName}</div>;`;
  }
  
  // Assemble the component
  return `/**
 * ${resourceName} ${componentName} Component
 */
${imports}
${props}
const ${resourceName}${componentName}${componentType} = (${withTS ? 'props' : `{ ${getPropsForComponent(templateName, componentName)} }`}) => {
  ${withI18n ? "const { t } = useCrudTranslation('crud');" : ""}
  ${content}
};

export default ${resourceName}${componentName};
`;
}

/**
 * Get props for a component based on template and component name
 */
function getPropsForComponent(templateName, componentName) {
  switch (templateName) {
    case "table":
      if (componentName === "Table") {
        return "data, loading, error, onRowClick";
      } 
      if (componentName === "TableRow") {
        return "item, onClick";
      } 
      if (componentName === "TableHeader") {
        return "onSort, sortField, sortOrder";
      } 
      if (componentName === "TablePagination") {
        return "page, total, perPage, onPageChange";
      } 
      if (componentName === "TableFilter") {
        return "filters, onFilterChange";
      }
      break;
    case "form":
      if (componentName === "Form") {
        return "initialData = {}, onSubmit, isEdit = false";
      } 
      if (componentName === "FormField") {
        return "field, value, onChange, error";
      } 
      if (componentName === "FormActions") {
        return "onSubmit, onCancel, isSubmitting";
      }
      break;
    // Add more cases for other templates
  }
  
  return "props";
}

/**
 * Generate table component content
 */
function generateTableComponent(componentName, resourceName, withI18n) {
  switch (componentName) {
    case "Table":
      return `// Table component for ${resourceName}
  if (loading) return <div>${withI18n ? "{t('loading')}" : "'Loading...'"}</div>;
  if (error) return <div>${withI18n ? "{t('error')}" : "'Error'"}: {error.message}</div>;
  
  return (
    <div className="crud-table-container">
      <${resourceName}TableHeader onSort={() => {}} sortField="id" sortOrder="asc" />
      <table className="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <${resourceName}TableRow 
              key={item.id} 
              item={item} 
              onClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
      <${resourceName}TablePagination 
        page={1} 
        total={data.length} 
        perPage={10} 
        onPageChange={() => {}}
      />
    </div>
  );`;
    
    case "TableRow":
      return `// Table row component for ${resourceName}
  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };
  
  return (
    <tr onClick={handleClick} className="crud-table-row">
      <td>{item.id}</td>
      <td>{item.name}</td>
      <td>{item.description}</td>
      <td className="crud-actions">
        <button className="view-btn">${withI18n ? "{t('view')}" : "'View'"}</button>
        <button className="edit-btn">${withI18n ? "{t('edit')}" : "'Edit'"}</button>
        <button className="delete-btn">${withI18n ? "{t('delete')}" : "'Delete'"}</button>
      </td>
    </tr>
  );`;
    
    case "TableHeader":
      return `// Table header component for ${resourceName}
  const handleSort = (field) => {
    if (onSort) {
      const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(field, newOrder);
    }
  };
  
  return (
    <div className="crud-table-header">
      <h2>${withI18n ? `{t('${resourceName.toLowerCase()}.list.title')}` : `${resourceName} List`}</h2>
      <div className="crud-table-actions">
        <button className="primary-btn">
          ${withI18n ? `{t('${resourceName.toLowerCase()}.create')}` : `Create ${resourceName}`}
        </button>
      </div>
    </div>
  );`;
    
    case "TablePagination":
      return `// Table pagination component for ${resourceName}
  const totalPages = Math.ceil(total / perPage);
  
  return (
    <div className="crud-pagination">
      <button 
        disabled={page === 1} 
        onClick={() => onPageChange(page - 1)}
        className="pagination-btn"
      >
        ${withI18n ? "{t('previous')}" : "'Previous'"}
      </button>
      <span className="pagination-info">
        ${withI18n ? 
          `{t('pagination', { current: page, total: totalPages })}` : 
          'Page {page} of {totalPages}'}
      </span>
      <button 
        disabled={page >= totalPages} 
        onClick={() => onPageChange(page + 1)}
        className="pagination-btn"
      >
        ${withI18n ? "{t('next')}" : "'Next'"}
      </button>
    </div>
  );`;
    
    case "TableFilter":
      return `// Table filter component for ${resourceName}
  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [key]: value });
    }
  };
  
  return (
    <div className="crud-filters">
      <div className="filter-item">
        <label>${withI18n ? "{t('search')}" : "'Search'"}</label>
        <input 
          type="text" 
          value={filters.search || ''} 
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="${withI18n ? `{t('${resourceName.toLowerCase()}.search')}` : `Search ${resourceName}`}"
        />
      </div>
      <div className="filter-item">
        <label>${withI18n ? "{t('status')}" : "'Status'"}</label>
        <select 
          value={filters.status || ''} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">${withI18n ? "{t('all')}" : "'All'"}</option>
          <option value="active">${withI18n ? "{t('active')}" : "'Active'"}</option>
          <option value="inactive">${withI18n ? "{t('inactive')}" : "'Inactive'"}</option>
        </select>
      </div>
      <button 
        onClick={() => onFilterChange({})}
        className="filter-reset-btn"
      >
        ${withI18n ? "{t('reset')}" : "'Reset'"}
      </button>
    </div>
  );`;
    
    default:
      return `// ${componentName} component for ${resourceName}\nreturn <div>${resourceName} ${componentName}</div>;`;
  }
}

/**
 * Generate form component content
 */
function generateFormComponent(componentName, resourceName, withI18n) {
  switch (componentName) {
    case "Form":
      return `// Form component for ${resourceName}
  const [values, setValues] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      // Success handling
    } catch (error) {
      // Error handling
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="crud-form">
      <h2>
        {isEdit 
          ? ${withI18n ? `t('${resourceName.toLowerCase()}.form.edit_title')` : `'Edit ${resourceName}'`}
          : ${withI18n ? `t('${resourceName.toLowerCase()}.form.create_title')` : `'Create ${resourceName}'`}
        }
      </h2>
      
      <form onSubmit={handleSubmit}>
        <${resourceName}FormField
          field={{ name: 'name', type: 'text', label: ${withI18n ? `t('${resourceName.toLowerCase()}.fields.name')` : `'Name'`} }}
          value={values.name || ''}
          onChange={handleChange}
          error={errors.name}
        />
        
        <${resourceName}FormField
          field={{ name: 'description', type: 'textarea', label: ${withI18n ? `t('${resourceName.toLowerCase()}.fields.description')` : `'Description'`} }}
          value={values.description || ''}
          onChange={handleChange}
          error={errors.description}
        />
        
        <${resourceName}FormActions
          onSubmit={handleSubmit}
          onCancel={() => {}}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );`;
    
    case "FormField":
      return `// Form field component for ${resourceName}
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            className={error ? 'error' : ''}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            rows={4}
            className={error ? 'error' : ''}
          ></textarea>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={value}
            onChange={onChange}
          />
        );
      
      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            className={error ? 'error' : ''}
          >
            <option value="">${withI18n ? "{t('select')}" : "'Select'"}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            className={error ? 'error' : ''}
          />
        );
    }
  };
  
  return (
    <div className="form-field">
      <label htmlFor={field.name}>{field.label}</label>
      {renderField()}
      {error && <div className="error-message">{error}</div>}
    </div>
  );`;
    
    case "FormActions":
      return `// Form actions component for ${resourceName}
  return (
    <div className="form-actions">
      <button 
        type="button" 
        onClick={onCancel}
        className="cancel-btn"
      >
        ${withI18n ? "{t('cancel')}" : "'Cancel'"}
      </button>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="submit-btn"
      >
        {isSubmitting 
          ? ${withI18n ? "{t('saving')}" : "'Saving...'"} 
          : ${withI18n ? "{t('save')}" : "'Save'"}
        }
      </button>
    </div>
  );`;
    
    case "FormValidation":
      return `// Form validation for ${resourceName}
export const validate${resourceName} = (values) => {
  const errors = {};
  
  if (!values.name) {
    errors.name = ${withI18n ? "t('validation.required')" : "'Name is required'"};
  }
  
  // Add more validation rules as needed
  
  return errors;
};

export const validateField = (field, value) => {
  if (field.required && !value) {
    return ${withI18n ? "t('validation.required')" : "'This field is required'"};
  }
  
  return null;
};`;
    
    default:
      return `// ${componentName} component for ${resourceName}\nreturn <div>${resourceName} ${componentName}</div>;`;
  }
}

/**
 * Generate detail component content
 */
function generateDetailComponent(componentName, resourceName, withI18n) {
  switch (componentName) {
    case "Detail":
      return `// Detail component for ${resourceName}
  const [activeTab, setActiveTab] = React.useState('details');
  
  return (
    <div className="crud-detail">
      <${resourceName}DetailHeader />
      <${resourceName}DetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="detail-content">
        {activeTab === 'details' && (
          <div className="detail-section">
            <h3>${withI18n ? `{t('${resourceName.toLowerCase()}.details')}` : 'Details'}</h3>
            <div className="detail-field">
              <span className="field-label">${withI18n ? `{t('${resourceName.toLowerCase()}.fields.name')}` : 'Name'}</span>
              <span className="field-value">Sample ${resourceName}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">${withI18n ? `{t('${resourceName.toLowerCase()}.fields.description')}` : 'Description'}</span>
              <span className="field-value">Sample description for this ${resourceName}</span>
            </div>
          </div>
        )}
        
        {activeTab === 'related' && (
          <${resourceName}DetailRelated />
        )}
      </div>
    </div>
  );`;
    
    case "DetailHeader":
      return `// Detail header component for ${resourceName}
  return (
    <div className="detail-header">
      <h2>Sample ${resourceName}</h2>
      <div className="detail-actions">
        <button className="edit-btn">${withI18n ? "{t('edit')}" : "'Edit'"}</button>
        <button className="delete-btn">${withI18n ? "{t('delete')}" : "'Delete'"}</button>
      </div>
    </div>
  );`;
    
    case "DetailTabs":
      return `// Detail tabs component for ${resourceName}
  return (
    <div className="detail-tabs">
      <button 
        className={\`tab \${activeTab === 'details' ? 'active' : ''}\`}
        onClick={() => onTabChange('details')}
      >
        ${withI18n ? `{t('${resourceName.toLowerCase()}.details')}` : 'Details'}
      </button>
      <button 
        className={\`tab \${activeTab === 'related' ? 'active' : ''}\`}
        onClick={() => onTabChange('related')}
      >
        ${withI18n ? `{t('${resourceName.toLowerCase()}.related')}` : 'Related Items'}
      </button>
    </div>
  );`;
    
    case "DetailRelated":
      return `// Detail related items component for ${resourceName}
  return (
    <div className="detail-related">
      <h3>${withI18n ? `{t('${resourceName.toLowerCase()}.related')}` : 'Related Items'}</h3>
      <table className="related-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Related Item 1</td>
            <td>
              <button>${withI18n ? "{t('view')}" : "'View'"}</button>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>Related Item 2</td>
            <td>
              <button>${withI18n ? "{t('view')}" : "'View'"}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );`;
    
    default:
      return `// ${componentName} component for ${resourceName}\nreturn <div>${resourceName} ${componentName}</div>;`;
  }
}

/**
 * Generate dashboard component content
 */
function generateDashboardComponent(componentName, resourceName, withI18n) {
  // Implementation for dashboard components
  return `// ${componentName} component for ${resourceName}\nreturn <div>${resourceName} ${componentName}</div>;`;
}

/**
 * Generate wizard component content
 */
function generateWizardComponent(componentName, resourceName, withI18n) {
  // Implementation for wizard components
  return `// ${componentName} component for ${resourceName}\nreturn <div>${resourceName} ${componentName}</div>;`;
}

/**
 * Generate kanban component content
 */
function generateKanbanComponent(componentName, resourceName, withI18n) {
  // Implementation for kanban components
  return `// ${componentName} component for ${resourceName}\nreturn <div>${resourceName} ${componentName}</div>;`;
}

/**
 * Generate all UI templates for a resource
 */
function generateAllTemplates(resourceName, options) {
  logger.title(`Generating all UI templates for '${resourceName}'`);
  
  for (const templateName of Object.keys(UI_TEMPLATES)) {
    generateTemplate(templateName, resourceName, options);
  }
  
  logger.success(`✅ Generated all UI templates for '${resourceName}'`);
  return true;
}

const crudUiCommand = new Command("crud-ui")
  .description("Generate CRUD UI templates")
  .option("-l, --list", "List available UI templates")
  .option("-t, --template <name>", "Template to generate")
  .option("-r, --resource <name>", "Resource name")
  .option("-a, --all", "Generate all templates for a resource")
  .option("-o, --output <path>", "Output directory", "components")
  .option("-i, --i18n", "Add internationalization support", true)
  .option("--typescript", "Generate TypeScript components", false)
  .action((options) => {
    if (options.list) {
      // List available templates
      listTemplates();
    } else if (options.all && options.resource) {
      // Generate all templates for a resource
      generateAllTemplates(options.resource, options);
    } else if (options.template && options.resource) {
      // Generate a specific template for a resource
      generateTemplate(options.template, options.resource, options);
    } else {
      // Show help if no valid options
      this.help();
    }
  });

export { crudUiCommand };
