import React, { useState } from "react";
import type { FormViewSchema, TableViewSchema, DetailViewSchema } from "@repo/view-engine/renderers/types";
import { useViewTranslations } from "../../i18n";

type ViewDesignerFormProps = {
  value: FormViewSchema | TableViewSchema | DetailViewSchema;
  onChange: (schema: FormViewSchema | TableViewSchema | DetailViewSchema) => void;
  availableSchemas: string[];
};

export function ViewDesignerForm({ value, onChange, availableSchemas }: ViewDesignerFormProps) {
  const t = useViewTranslations();
  const [activeTab, setActiveTab] = useState<"general" | "layout" | "fields">("general");

  // Handle schema change
  const handleSchemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      schema: e.target.value
    });
  };

  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as "form" | "table" | "detail";
    
    // Create a new schema based on the selected type
    if (newType === "form") {
      onChange({
        ...value,
        type: "form",
        layout: value.type === "form" ? value.layout : undefined
      } as FormViewSchema);
    } else if (newType === "table") {
      onChange({
        ...value,
        type: "table",
        columns: value.type === "table" ? value.columns : []
      } as TableViewSchema);
    } else if (newType === "detail") {
      onChange({
        ...value,
        type: "detail",
        layout: value.type === "detail" ? value.layout : undefined
      } as DetailViewSchema);
    }
  };

  // Render general settings tab
  const renderGeneralTab = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("designer.schema")}
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={value.schema}
            onChange={handleSchemaChange}
          >
            <option value="">{t("designer.selectSchema")}</option>
            {availableSchemas.map(schema => (
              <option key={schema} value={schema}>{schema}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("designer.viewType")}
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={value.type}
            onChange={handleTypeChange}
          >
            <option value="form">{t("designer.types.form")}</option>
            <option value="table">{t("designer.types.table")}</option>
            <option value="detail">{t("designer.types.detail")}</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("designer.i18nNamespace")}
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={value.i18nNamespace || ""}
            onChange={e => onChange({ ...value, i18nNamespace: e.target.value })}
            placeholder={t("designer.i18nNamespacePlaceholder")}
          />
        </div>
      </div>
    );
  };

  // Render layout settings tab
  const renderLayoutTab = () => {
    if (value.type === "form" || value.type === "detail") {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              {t("designer.layoutEditorComingSoon")}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("designer.layoutJson")}
            </label>
            <textarea
              className="w-full p-2 border rounded-md font-mono text-sm h-40"
              value={JSON.stringify(value.layout || {}, null, 2)}
              onChange={e => {
                try {
                  const layout = JSON.parse(e.target.value);
                  onChange({ ...value, layout });
                } catch (error) {
                  // Ignore JSON parse errors while typing
                }
              }}
            />
          </div>
        </div>
      );
    } else if (value.type === "table") {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              {t("designer.columnEditorComingSoon")}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("designer.columnsJson")}
            </label>
            <textarea
              className="w-full p-2 border rounded-md font-mono text-sm h-40"
              value={JSON.stringify(value.columns || [], null, 2)}
              onChange={e => {
                try {
                  const columns = JSON.parse(e.target.value);
                  onChange({ ...value, columns });
                } catch (error) {
                  // Ignore JSON parse errors while typing
                }
              }}
            />
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Render fields settings tab
  const renderFieldsTab = () => {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            {t("designer.fieldEditorComingSoon")}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("designer.fieldsJson")}
          </label>
          <textarea
            className="w-full p-2 border rounded-md font-mono text-sm h-40"
            value={JSON.stringify(value.fields || {}, null, 2)}
            onChange={e => {
              try {
                const fields = JSON.parse(e.target.value);
                onChange({ ...value, fields });
              } catch (error) {
                // Ignore JSON parse errors while typing
              }
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          className={`px-4 py-2 font-medium ${
            activeTab === "general"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("general")}
        >
          {t("designer.tabs.general")}
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium ${
            activeTab === "layout"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("layout")}
        >
          {t("designer.tabs.layout")}
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium ${
            activeTab === "fields"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("fields")}
        >
          {t("designer.tabs.fields")}
        </button>
      </div>
      
      {/* Tab content */}
      <div>
        {activeTab === "general" && renderGeneralTab()}
        {activeTab === "layout" && renderLayoutTab()}
        {activeTab === "fields" && renderFieldsTab()}
      </div>
    </div>
  );
}
