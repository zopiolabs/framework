# View Package Developer Guide

This guide provides detailed information for developers working with the View Package, including common usage patterns, advanced usage, and troubleshooting tips.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [View Schema Structure](#view-schema-structure)
3. [Integration with CRUD Components](#integration-with-crud-components)
4. [Internationalization](#internationalization)
5. [Error Handling](#error-handling)
6. [Persistence Layer](#persistence-layer)
7. [View Designer](#view-designer)
8. [Testing Strategies](#testing-strategies)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The View Package is built around the concept of schema-driven UI components. The main components are:

- **Engine**: Core rendering and validation logic
- **Service**: Persistence layer for storing and retrieving view schemas
- **Designer**: UI components for creating and editing view schemas
- **i18n**: Internationalization support

### Component Hierarchy

```
view/
├── engine/
│   ├── renderers/
│   ├── validation/
│   └── error/
├── service/
│   └── storage/
├── designer/
│   └── components/
└── i18n/
```

## View Schema Structure

Each view schema has a common structure with type-specific properties:

### Common Properties

```typescript
interface BaseViewSchema {
  id: string;
  type: string;
  title?: string;
  description?: string;
  i18nNamespace?: string;
  metadata?: Record<string, unknown>;
}
```

### Form View Schema

```typescript
interface FormViewSchema extends BaseViewSchema {
  type: 'form';
  schema: Record<string, unknown>;
  fields?: FormField[];
  layout?: FormLayout;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
}
```

### Table View Schema

```typescript
interface TableViewSchema extends BaseViewSchema {
  type: 'table';
  schema: Record<string, unknown>;
  columns?: TableColumn[];
  pagination?: PaginationOptions;
  defaultSort?: SortOptions;
  rowActions?: Action[];
  bulkActions?: Action[];
  selectable?: boolean;
}
```

See the type definitions in `engine/renderers/types.ts` for complete schema structures.

## Integration with CRUD Components

The View Package is designed to integrate seamlessly with CRUD components. The `renderView` function maps view schemas to the appropriate CRUD components:

```typescript
// Form view integration
function FormView({ schema, data, onSubmit }) {
  return (
    <AutoForm 
      schema={schema.schema} 
      initialData={data}
      onSubmit={onSubmit}
      // Other props from schema
    />
  );
}

// Table view integration
function TableView({ schema, data }) {
  return (
    <AutoTable 
      schema={schema.schema} 
      data={data || []}
      // Other props from schema
    />
  );
}
```

### Example: Creating a Custom View Renderer

You can create custom view renderers for specific view types:

```typescript
function CustomFormView({ schema, data, onSubmit }) {
  // Custom rendering logic
  return (
    <div className="custom-form">
      <AutoForm 
        schema={schema.schema} 
        initialData={data}
        onSubmit={onSubmit}
        // Custom props
        customProp={schema.customProp}
      />
    </div>
  );
}

// Register the custom renderer
function renderView(schema, options) {
  // ...
  if (schema.type === 'custom-form') {
    return <CustomFormView schema={schema} data={options?.data} onSubmit={options?.onSubmit} />;
  }
  // ...
}
```

## Internationalization

The View Package uses next-intl for internationalization. Translation files are stored in the `locales` directory.

### Translation Structure

```
locales/
├── en/
│   └── view.json
├── tr/
│   └── view.json
├── es/
│   └── view.json
└── de/
    └── view.json
```

### Using Translations in Components

```typescript
import { useViewTranslations } from '@repo/view';

function MyComponent() {
  const t = useViewTranslations('view');
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Server-Side Translations

```typescript
import { translateServer } from '@repo/view';

async function getServerSideProps({ locale }) {
  const title = await translateServer(locale, 'view', 'common.title');
  
  return {
    props: {
      title
    }
  };
}
```

### Adding a New Language

1. Create a new directory in `locales` with the language code
2. Copy the `view.json` file from the `en` directory
3. Translate the strings in the copied file
4. Update the i18n configuration to include the new language

## Error Handling

The View Package includes a comprehensive error handling system with custom error classes and an error boundary component.

### Error Classes

```typescript
// Base error class
class ViewError extends Error {}

// Specific error classes
class ViewSchemaValidationError extends ViewError {}
class UnsupportedViewTypeError extends ViewError {}
class ViewNotFoundError extends ViewError {}
class ViewRenderingError extends ViewError {}
```

### Using the Error Boundary

```typescript
import { ViewErrorBoundary } from '@repo/view';

function MyComponent() {
  return (
    <ViewErrorBoundary fallback={(error) => <div>Custom error UI: {error.message}</div>}>
      {/* Your view components */}
    </ViewErrorBoundary>
  );
}
```

### Error Handling in the Render Function

The `renderView` function includes built-in error handling:

```typescript
function renderView(schema, options) {
  return (
    <ViewErrorBoundary fallback={options?.errorFallback}>
      <RenderView 
        schema={schema} 
        // Other props
      />
    </ViewErrorBoundary>
  );
}
```

## Persistence Layer

The View Package includes a persistence layer for storing and retrieving view schemas.

### Storage Providers

- **LocalStorageProvider**: Uses the browser's localStorage for client-side persistence
- **FileStorageProvider**: Uses the file system for server-side persistence

### Initializing the Service

```typescript
import { initViewService } from '@repo/view';

// Initialize with local storage
initViewService({ type: 'local', storagePrefix: 'my-app' });

// Initialize with file storage
initViewService({ type: 'file', storagePath: './views' });

// Initialize with a custom provider
initViewService(myCustomProvider);
```

### Using the Service

```typescript
import { saveView, getView, listViews, deleteView } from '@repo/view';

// Save a view schema
await saveView('my-view', myViewSchema);

// Get a view schema
const viewSchema = await getView('my-view');

// List all view schemas
const viewIds = await listViews();

// Delete a view schema
await deleteView('my-view');
```

### Creating a Custom Storage Provider

```typescript
import { ViewStorageProvider } from '@repo/view';

class DatabaseStorageProvider implements ViewStorageProvider {
  async saveView(id: string, view: ViewSchema): Promise<void> {
    // Save to database
  }
  
  async getView(id: string): Promise<ViewSchema | undefined> {
    // Get from database
  }
  
  async listViews(): Promise<string[]> {
    // List from database
  }
  
  async deleteView(id: string): Promise<void> {
    // Delete from database
  }
}

// Initialize with the custom provider
initViewService(new DatabaseStorageProvider());
```

## View Designer

The View Designer provides a visual interface for creating and editing view schemas.

### Basic Usage

```typescript
import { ViewDesigner } from '@repo/view';

function MyDesigner() {
  const [schema, setSchema] = useState(initialSchema);
  
  return (
    <ViewDesigner
      value={schema}
      onChange={setSchema}
      availableSchemas={['user', 'product', 'order']}
    />
  );
}
```

### Saving and Loading Schemas

```typescript
import { ViewDesigner, saveView, getView } from '@repo/view';

function MyDesigner() {
  const [schema, setSchema] = useState(initialSchema);
  
  useEffect(() => {
    async function loadSchema() {
      const loadedSchema = await getView('my-view');
      if (loadedSchema) {
        setSchema(loadedSchema);
      }
    }
    
    loadSchema();
  }, []);
  
  const handleSave = async () => {
    await saveView('my-view', schema);
  };
  
  return (
    <div>
      <ViewDesigner
        value={schema}
        onChange={setSchema}
        availableSchemas={['user', 'product', 'order']}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

## Testing Strategies

### Unit Testing

Use Jest and React Testing Library for unit testing components:

```typescript
import { render, screen } from '@testing-library/react';
import { renderView } from '@repo/view';

describe('renderView', () => {
  it('renders a form view', () => {
    const schema = {
      id: 'test-form',
      type: 'form',
      schema: {},
      fields: [
        { name: 'name', label: 'Name', type: 'string' }
      ]
    };
    
    render(renderView(schema));
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
```

### Integration Testing

Use Cypress for integration testing:

```typescript
describe('View Designer', () => {
  it('creates a form view', () => {
    cy.visit('/designer');
    cy.get('[data-testid="view-type-select"]').select('form');
    cy.get('[data-testid="add-field-button"]').click();
    cy.get('[data-testid="field-name-input"]').type('name');
    cy.get('[data-testid="field-label-input"]').type('Name');
    cy.get('[data-testid="save-button"]').click();
    cy.get('[data-testid="preview-button"]').click();
    cy.get('label').should('contain', 'Name');
  });
});
```

## Troubleshooting

### Common Issues

#### Schema Validation Errors

If you're seeing schema validation errors, check that your schema conforms to the expected structure:

```typescript
// Check the schema structure
const validationResult = safeValidateViewSchema(schema);
if (!validationResult.success) {
  console.error(validationResult.error);
}
```

#### Rendering Errors

If views are not rendering correctly, check for errors in the console and ensure that the CRUD components are available:

```typescript
// Wrap with error boundary to catch rendering errors
<ViewErrorBoundary
  fallback={(error) => {
    console.error(error);
    return <div>Error rendering view: {error.message}</div>;
  }}
>
  {renderView(schema)}
</ViewErrorBoundary>
```

#### Storage Issues

If you're having issues with storage, check that the storage provider is initialized correctly:

```typescript
// Check if the storage provider is initialized
try {
  const views = await listViews();
  console.log('Storage provider is working:', views);
} catch (error) {
  console.error('Storage provider error:', error);
}
```

### Debugging Tips

- Use the `ViewErrorBoundary` component to catch and display rendering errors
- Enable debug mode in the view service: `initViewService({ debug: true })`
- Check the browser console for error messages
- Use React DevTools to inspect component props and state

## Best Practices

- **Type Safety**: Use TypeScript and the provided type definitions
- **Validation**: Always validate schemas before rendering
- **Error Handling**: Use error boundaries to catch and handle errors
- **Internationalization**: Use the provided translation hooks
- **Testing**: Write tests for custom components and schemas

## Contributing

See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for information on how to contribute to the View Package.

## License

MIT
