import * as React from "react";
import { useState, useEffect } from "react";
import type { ViewSchema } from "../../engine/renderers/types";
import { renderView } from "../../engine/renderers/renderView";
import { ViewDesignerForm } from "./ViewDesignerForm";
import { useViewTranslations } from "../../i18n";

type ViewDesignerProps = {
  value: ViewSchema;
  onChange: (schema: ViewSchema) => void;
  availableSchemas?: string[];
};

/**
 * Enhanced ViewDesigner component with form-based editing and preview
 */
export function ViewDesigner({ 
  value, 
  onChange, 
  availableSchemas = [] 
}: ViewDesignerProps) {
  const t = useViewTranslations();
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  
  // Initialize with default values if needed
  useEffect(() => {
    const updatedSchema: Partial<ViewSchema> = {};
    let needsUpdate = false;
    
    // Copy existing values
    if (value) {
      Object.assign(updatedSchema, value);
    }
    
    // Set schema if not present
    if (!updatedSchema.schema && availableSchemas.length > 0) {
      updatedSchema.schema = availableSchemas[0];
      needsUpdate = true;
    }
    
    // Set type if not present
    if (!updatedSchema.type) {
      updatedSchema.type = "form";
      needsUpdate = true;
    }
    
    // Only trigger onChange if we made changes
    if (needsUpdate) {
      onChange(updatedSchema as ViewSchema);
    }
  }, [value, onChange, availableSchemas]);
  
  // Generate sample data for preview
  useEffect(() => {
    if (Array.isArray(value.fields)) {
      const sampleData: Record<string, unknown> = {};
      
      for (const field of value.fields) {
        if (typeof field === 'object' && field !== null && 'name' in field && 'type' in field) {
          const fieldName = field.name as string;
          const fieldType = field.type as string;
          
          // Generate sample data based on field type
          if (fieldType === "string" || !fieldType) {
            sampleData[fieldName] = `Sample ${fieldName}`;
          } else if (fieldType === "number") {
            sampleData[fieldName] = 42;
          } else if (fieldType === "boolean") {
            sampleData[fieldName] = true;
          } else if (fieldType === "date") {
            sampleData[fieldName] = new Date().toISOString();
          } else if (fieldType === "select" && Array.isArray(field.options) && field.options.length > 0) {
            const firstOption = field.options[0];
            if (typeof firstOption === 'object' && firstOption !== null && 'value' in firstOption) {
              sampleData[fieldName] = firstOption.value;
            } else {
              sampleData[fieldName] = firstOption;
            }
          }
        }
      }
      
      setPreviewData(sampleData);
    }
  }, [value.fields]);
  
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t("designer.title")}</h2>
        
        <div className="flex space-x-2">
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              !previewMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setPreviewMode(false)}
          >
            {t("designer.edit")}
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              previewMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setPreviewMode(true)}
          >
            {t("designer.preview")}
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {previewMode ? (
          <div className="border rounded-md p-4">
            <div className="mb-4 pb-2 border-b">
              <h3 className="text-sm font-medium text-gray-500">{t("designer.previewMode")}</h3>
            </div>
            
            <div className="preview-container">
              {renderView(value)}
            </div>
          </div>
        ) : (
          <ViewDesignerForm
            value={value}
            onChange={onChange}
            availableSchemas={availableSchemas}
          />
        )}
      </div>
    </div>
  );
}
