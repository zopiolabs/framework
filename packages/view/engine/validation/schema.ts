import { z } from "zod";
import type { 
  ViewSchema, 
  FormViewSchema, 
  TableViewSchema, 
  DetailViewSchema, 
  AuditLogViewSchema, 
  ImportViewSchema, 
  ExportViewSchema 
} from '../renderers/types';

/**
 * Common fields for all view schemas
 */
const commonViewFields = {
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  i18nNamespace: z.string().optional(),
  metadata: z.record(z.any()).optional(),
};

/**
 * Form field definition schema
 */
const formFieldSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  type: z.string(),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(
    z.object({
      label: z.string(),
      value: z.any(),
    })
  ).optional(),
  validation: z.record(z.any()).optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  width: z.union([z.string(), z.number()]).optional(),
  className: z.string().optional(),
});

/**
 * Form layout schema
 */
const formLayoutSchema = z.object({
  type: z.enum(['grid', 'tabs', 'sections', 'wizard']),
  config: z.record(z.any()).optional(),
}).optional();

/**
 * Table column schema
 */
const tableColumnSchema = z.object({
  key: z.string(),
  header: z.string().optional(),
  width: z.union([z.string(), z.number()]).optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  hidden: z.boolean().optional(),
  className: z.string().optional(),
  render: z.any().optional(), // Function reference can't be validated by Zod
});

/**
 * Pagination schema
 */
const paginationSchema = z.object({
  enabled: z.boolean().optional(),
  pageSize: z.number().optional(),
  pageSizeOptions: z.array(z.number()).optional(),
}).optional();

/**
 * Sort schema
 */
const sortSchema = z.object({
  key: z.string(),
  direction: z.enum(['asc', 'desc']),
}).optional();

/**
 * Action schema
 */
const actionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  variant: z.string().optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  confirm: z.object({
    title: z.string().optional(),
    message: z.string().optional(),
    confirmText: z.string().optional(),
    cancelText: z.string().optional(),
  }).optional(),
});

/**
 * Form view schema validation
 */
const formViewSchema = z.object({
  ...commonViewFields,
  type: z.literal('form'),
  schema: z.record(z.any()),
  fields: z.array(formFieldSchema).optional(),
  layout: formLayoutSchema,
  submitLabel: z.string().optional(),
  resetLabel: z.string().optional(),
  showReset: z.boolean().optional(),
});

/**
 * Table view schema validation
 */
const tableViewSchema = z.object({
  ...commonViewFields,
  type: z.literal('table'),
  schema: z.record(z.any()),
  columns: z.array(tableColumnSchema).optional(),
  pagination: paginationSchema,
  defaultSort: sortSchema,
  rowActions: z.array(actionSchema).optional(),
  bulkActions: z.array(actionSchema).optional(),
  selectable: z.boolean().optional(),
});

/**
 * Detail view schema validation
 */
const detailViewSchema = z.object({
  ...commonViewFields,
  type: z.literal('detail'),
  schema: z.record(z.any()),
  fields: z.array(formFieldSchema).optional(),
  layout: formLayoutSchema,
  actions: z.array(actionSchema).optional(),
});

/**
 * Audit log view schema validation
 */
const auditLogViewSchema = z.object({
  ...commonViewFields,
  type: z.literal('audit-log'),
  schema: z.record(z.any()),
  entityIdField: z.string().optional(),
  showUser: z.boolean().optional(),
  showTimestamp: z.boolean().optional(),
  showAction: z.boolean().optional(),
});

/**
 * Import view schema validation
 */
const importViewSchema = z.object({
  ...commonViewFields,
  type: z.literal('import'),
  schema: z.record(z.any()),
  fileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  templateUrl: z.string().optional(),
  instructions: z.string().optional(),
});

/**
 * Export view schema validation
 */
const exportViewSchema = z.object({
  ...commonViewFields,
  type: z.literal('export'),
  schema: z.record(z.any()),
  formats: z.array(z.string()).optional(),
  defaultFormat: z.string().optional(),
  includeHeaders: z.boolean().optional(),
  fileName: z.string().optional(),
});

/**
 * Combined view schema validation
 */
const viewSchemaValidation = z.discriminatedUnion('type', [
  formViewSchema,
  tableViewSchema,
  detailViewSchema,
  auditLogViewSchema,
  importViewSchema,
  exportViewSchema,
]);

/**
 * Type guard for form view schema
 */
export function isFormViewSchema(schema: ViewSchema): schema is FormViewSchema {
  return schema.type === 'form';
}

/**
 * Type guard for table view schema
 */
export function isTableViewSchema(schema: ViewSchema): schema is TableViewSchema {
  return schema.type === 'table';
}

/**
 * Type guard for detail view schema
 */
export function isDetailViewSchema(schema: ViewSchema): schema is DetailViewSchema {
  return schema.type === 'detail';
}

/**
 * Type guard for audit log view schema
 */
export function isAuditLogViewSchema(schema: ViewSchema): schema is AuditLogViewSchema {
  return schema.type === 'audit-log';
}

/**
 * Type guard for import view schema
 */
export function isImportViewSchema(schema: ViewSchema): schema is ImportViewSchema {
  return schema.type === 'import';
}

/**
 * Type guard for export view schema
 */
export function isExportViewSchema(schema: ViewSchema): schema is ExportViewSchema {
  return schema.type === 'export';
}

/**
 * Validates a view schema and returns a validation result
 * @param schema The view schema to validate
 * @returns A validation result with success flag and either the validated data or an error
 */
export function validateViewSchema(schema: ViewSchema) {
  return viewSchemaValidation.safeParse(schema);
}

/**
 * Safely validates a view schema and returns a validation result
 * This function catches any errors that might occur during validation
 * @param schema The view schema to validate
 * @returns A validation result with success flag and either the validated data or an error
 */
export function safeValidateViewSchema(schema: ViewSchema) {
  try {
    return validateViewSchema(schema);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown validation error'),
    };
  }
}
