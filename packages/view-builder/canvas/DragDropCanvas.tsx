import { useState, useCallback, useEffect } from "react";
import { useSchemaState } from "../hooks/useSchemaState";
import { renderView } from "@repo/view";
import type { FormField } from "../hooks/useSchemaState";
import type { ViewSchema } from "@repo/view/engine/renderers/types";

// UI Components (replace with your actual UI components)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Component for rendering a field in the canvas
 */
function FieldPreview({ field, onEdit, onDelete }: { 
  field: FormField; 
  onEdit: (field: FormField) => void; 
  onDelete: (name: string) => void; 
}) {
  return (
    <div className="p-3 border rounded-md mb-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">{field.label}</h4>
        <div className="space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(field)}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(field.name)}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mb-2">
        Type: {field.type} {field.required && "(Required)"}
      </div>
      
      {field.type === "string" && (
        <Input placeholder={field.placeholder || field.label} disabled />
      )}
      
      {field.type === "boolean" && (
        <div className="flex items-center space-x-2">
          <Checkbox id={field.name} disabled />
          <Label htmlFor={field.name}>{field.label}</Label>
        </div>
      )}
      
      {field.options && field.options.length > 0 && (
        <div className="text-xs mt-1">
          Options: {field.options.join(", ")}
        </div>
      )}
    </div>
  );
}

/**
 * Field editor component
 */
function FieldEditor({ field, onSave, onCancel }: { 
  field?: FormField; 
  onSave: (field: FormField) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(field?.name || `field-${Date.now()}`);
  const [label, setLabel] = useState(field?.label || "");
  const [type, setType] = useState(field?.type || "string");
  const [required, setRequired] = useState(field?.required || false);
  const [description, setDescription] = useState(field?.description || "");
  const [placeholder, setPlaceholder] = useState(field?.placeholder || "");
  const [options, setOptions] = useState(field?.options?.join(",") || "");
  
  const handleSave = () => {
    if (!label) {
      alert("Label is required");
      return;
    }
    
    onSave({
      name,
      label,
      type,
      required,
      description: description || undefined,
      placeholder: placeholder || undefined,
      options: options ? options.split(",").map(o => o.trim()) : undefined
    });
  };
  
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-medium">{field ? "Edit Field" : "Add Field"}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="field-label">Label</Label>
        <Input 
          id="field-label" 
          value={label} 
          onChange={e => setLabel(e.target.value)} 
          placeholder="Field Label"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="field-type">Type</Label>
        <select 
          id="field-type" 
          value={type} 
          onChange={e => setType(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="string">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Checkbox</option>
          <option value="date">Date</option>
          <option value="select">Select</option>
        </select>
      </div>
      
      {type === "select" && (
        <div className="space-y-2">
          <Label htmlFor="field-options">Options (comma separated)</Label>
          <Input 
            id="field-options" 
            value={options} 
            onChange={e => setOptions(e.target.value)} 
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="field-placeholder">Placeholder</Label>
        <Input 
          id="field-placeholder" 
          value={placeholder} 
          onChange={e => setPlaceholder(e.target.value)} 
          placeholder="Field Placeholder"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="field-description">Description</Label>
        <Input 
          id="field-description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Field Description"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="field-required" 
          checked={required} 
          onCheckedChange={(checked) => setRequired(checked === true)}
        />
        <Label htmlFor="field-required">Required</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Field</Button>
      </div>
    </Card>
  );
}

/**
 * Preview component for the view
 */
function ViewPreview({ schema }: { schema: ViewSchema }) {
  return (
    <div className="border rounded-md p-4 bg-white">
      <h3 className="text-lg font-medium mb-4">Preview</h3>
      {renderView(schema, {
        onSubmit: (data) => console.log("Form submitted:", data)
      })}
    </div>
  );
}

/**
 * Main canvas component for drag and drop view building
 */
export function DragDropCanvas() {
  const { schema, addField, removeField, updateField } = useSchemaState();
  const [editingField, setEditingField] = useState<FormField | undefined>();
  const [activeTab, setActiveTab] = useState("editor");
  
  const handleAddField = useCallback((field: FormField) => {
    addField(field);
    setEditingField(undefined);
  }, [addField]);
  
  const handleUpdateField = useCallback((field: FormField) => {
    updateField(field.name, field);
    setEditingField(undefined);
  }, [updateField]);
  
  const handleEditField = useCallback((field: FormField) => {
    setEditingField(field);
  }, []);
  
  const handleDeleteField = useCallback((name: string) => {
    if (confirm(`Are you sure you want to delete the field '${name}'?`)) {
      removeField(name);
    }
  }, [removeField]);
  
  const handleCancelEdit = useCallback(() => {
    setEditingField(undefined);
  }, []);
  
  // Get fields from schema
  const fields = Object.entries(schema.fields || {}).map(([name, field]) => ({
    name,
    label: field.label || name,
    type: field.type || "string",
    required: field.required || false,
    options: field.options,
    description: field.description,
    placeholder: field.placeholder
  }));
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Form Builder</h2>
            <Button onClick={() => setEditingField({} as FormField)}>Add Field</Button>
          </div>
          
          {editingField ? (
            <FieldEditor 
              field={editingField} 
              onSave={editingField.name ? handleUpdateField : handleAddField} 
              onCancel={handleCancelEdit} 
            />
          ) : (
            <div className="space-y-2">
              {fields.length === 0 ? (
                <div className="p-8 border border-dashed rounded-md text-center text-muted-foreground">
                  No fields added yet. Click "Add Field" to start building your form.
                </div>
              ) : (
                fields.map(field => (
                  <FieldPreview 
                    key={field.name} 
                    field={field} 
                    onEdit={handleEditField} 
                    onDelete={handleDeleteField} 
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preview" className="flex-1">
          <ViewPreview schema={schema} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
