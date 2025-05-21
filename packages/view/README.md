# View Package

The View Package provides a schema-driven approach to building UI components with integrated CRUD functionality, internationalization support, and error handling.

## Features

- **Schema-Driven Views**: Define your UI components using JSON schemas
- **Type Safety**: Enhanced type definitions for different view types
- **Validation**: Zod-based schema validation to ensure compatibility with CRUD components
- **Internationalization**: Built-in support for multiple languages
- **Error Handling**: Comprehensive error handling with custom error boundaries
- **Persistence**: Storage providers for both client and server-side persistence
- **Designer**: Visual designer for creating and editing view schemas

## Installation

```bash
npm install @repo/view
```

## Basic Usage

```tsx
import { renderView, ViewSchema } from '@repo/view';

// Define a form view schema
const formSchema: ViewSchema = {
  id: 'user-form',
  type: 'form',
  schema: 'user',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'string',
      required: true
    }
  ]
};

// Render the view
function UserForm() {
  return renderView(formSchema, {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    }
  });
}
```

## View Types

The package supports the following view types:

- **Form**: For creating and editing data
- **Table**: For displaying tabular data
- **Detail**: For displaying detailed information about a record
- **Audit Log**: For displaying audit logs
- **Import**: For importing data
- **Export**: For exporting data

## Schema Validation

All view schemas are validated using Zod to ensure they meet the required structure:

```tsx
import { validateViewSchema } from '@repo/view';

const validationResult = validateViewSchema(mySchema);
if (validationResult.success) {
  // Schema is valid
  const validatedSchema = validationResult.data;
} else {
  // Schema is invalid
  console.error(validationResult.error);
}
```

## Error Handling

The package includes a comprehensive error handling system:

```tsx
import { ViewErrorBoundary } from '@repo/view';

function MyComponent() {
  return (
    <ViewErrorBoundary fallback={(error) => <div>Custom error UI: {error.message}</div>}>
      {/* Your view components */}
    </ViewErrorBoundary>
  );
}
```

## Internationalization

The package supports internationalization using next-intl:

```tsx
import { useViewTranslations } from '@repo/view';

function MyComponent() {
  const t = useViewTranslations('view');
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('common.description')}</p>
    </div>
  );
}
```

### Supported Locales

- English (en)
- Turkish (tr)
- Spanish (es)
- German (de)

## Persistence

The package includes storage providers for persisting view schemas:

```tsx
import { initViewService, saveView, getView } from '@repo/view';

// Initialize with local storage
initViewService({ type: 'local', storagePrefix: 'my-app' });

// Save a view schema
await saveView('my-view', myViewSchema);

// Get a view schema
const viewSchema = await getView('my-view');
```

## View Designer

The package includes a visual designer for creating and editing view schemas:

```tsx
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

## API Reference

### Components

- `renderView(schema, options)`: Renders a view based on the provided schema
- `ViewErrorBoundary`: Error boundary component for catching and displaying view rendering errors
- `ViewDesigner`: Component for visually designing view schemas
- `ViewDesignerForm`: Form component for editing view schemas

### Hooks

- `useViewTranslations(namespace)`: Hook for accessing translations
- `useViewSchema(id)`: Hook for fetching a view schema by ID

### Functions

- `validateViewSchema(schema)`: Validates a view schema
- `safeValidateViewSchema(schema)`: Safely validates a view schema (doesn't throw errors)
- `initViewService(options)`: Initializes the view service with storage options
- `saveView(id, schema)`: Saves a view schema
- `getView(id)`: Gets a view schema by ID
- `listViews()`: Lists all available view schemas
- `deleteView(id)`: Deletes a view schema

## License

MIT
