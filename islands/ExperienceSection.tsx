import { useState } from "preact/hooks";
import { formatDateRange } from "../lib/utils/date.ts";

interface Experience {
  id: number;
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  responsibilities: string[] | null;
  achievements: string[] | null;
  narrative: string | null;
}

interface EditState {
  id: number;
  currentData: Experience;
}

// Helper function to format date for input
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export default function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = (exp: Experience) => {
    setEditState({
      id: exp.id,
      currentData: { ...exp }
    });
  };

  const handleCancel = () => {
    setEditState(null);
  };

  const handleFieldChange = (field: keyof Experience, value: any) => {
    if (!editState) return;
    setEditState({
      ...editState,
      currentData: {
        ...editState.currentData,
        [field]: value
      }
    });
  };

  const handleArrayItemChange = (field: 'responsibilities' | 'achievements', index: number, value: string) => {
    if (!editState) return;
    const newArray = [...(editState.currentData[field] || [])];
    newArray[index] = value;
    handleFieldChange(field, newArray);
  };

  const handleAddArrayItem = (field: 'responsibilities' | 'achievements') => {
    if (!editState) return;
    const newArray = [...(editState.currentData[field] || []), ''];
    handleFieldChange(field, newArray);
  };

  const handleRemoveArrayItem = (field: 'responsibilities' | 'achievements', index: number) => {
    if (!editState) return;
    const newArray = (editState.currentData[field] || []).filter((_, i) => i !== index);
    handleFieldChange(field, newArray);
  };

  const handleSave = async () => {
    if (!editState) return;

    setIsSaving(true);
    try {
      // Update all fields that have changed
      const fields = ['title', 'company', 'location', 'start_date', 'end_date', 'responsibilities', 'achievements', 'narrative'];
      
      for (const field of fields) {
        // Skip empty array updates
        if ((field === 'responsibilities' || field === 'achievements') && 
            (!editState.currentData[field] || editState.currentData[field]?.length === 0)) {
          continue;
        }

        // Clean up empty strings from arrays before saving
        let value = editState.currentData[field as keyof Experience];
        if (field === 'responsibilities' || field === 'achievements') {
          value = (value as string[])?.filter(item => item.trim() !== '') || null;
        }

        const response = await fetch(`/api/experience/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editState.id,
            field,
            value
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update ${field}: ${errorData.error || 'Unknown error'}`);
        }
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to save experience:', error);
      setEditState(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div class="space-y-4">
      {experiences.map((exp) => (
        <div key={exp.id} class="border rounded-lg p-4">
          <div>
            <div class="group relative">
              {editState?.id === exp.id ? (
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={editState.currentData.title}
                      onChange={(e) => handleFieldChange('title', e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                      class="w-full p-1 border rounded font-medium mt-1"
                      autoFocus
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Company</label>
                    <input
                      type="text"
                      value={editState.currentData.company}
                      onChange={(e) => handleFieldChange('company', e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                      class="w-full p-1 border rounded mt-1"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={editState.currentData.location || ''}
                      onChange={(e) => handleFieldChange('location', e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                      class="w-full p-1 border rounded mt-1"
                      disabled={isSaving}
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={formatDateForInput(editState.currentData.start_date)}
                        onChange={(e) => handleFieldChange('start_date', e.currentTarget.value)}
                        onKeyDown={handleKeyDown}
                        class="w-full p-1 border rounded mt-1"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        value={formatDateForInput(editState.currentData.end_date)}
                        onChange={(e) => handleFieldChange('end_date', e.currentTarget.value || null)}
                        onKeyDown={handleKeyDown}
                        class="w-full p-1 border rounded mt-1"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Responsibilities</label>
                    <div class="space-y-2 mt-1">
                      {(editState.currentData.responsibilities || []).map((resp, index) => (
                        <div key={index} class="flex gap-2">
                          <input
                            type="text"
                            value={resp}
                            onChange={(e) => handleArrayItemChange('responsibilities', index, e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            class="flex-1 p-1 border rounded"
                            disabled={isSaving}
                          />
                          <button
                            onClick={() => handleRemoveArrayItem('responsibilities', index)}
                            disabled={isSaving}
                            class="px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem('responsibilities')}
                        disabled={isSaving}
                        class="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Responsibility
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Achievements</label>
                    <div class="space-y-2 mt-1">
                      {(editState.currentData.achievements || []).map((achievement, index) => (
                        <div key={index} class="flex gap-2">
                          <input
                            type="text"
                            value={achievement}
                            onChange={(e) => handleArrayItemChange('achievements', index, e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            class="flex-1 p-1 border rounded"
                            disabled={isSaving}
                          />
                          <button
                            onClick={() => handleRemoveArrayItem('achievements', index)}
                            disabled={isSaving}
                            class="px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem('achievements')}
                        disabled={isSaving}
                        class="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Achievement
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Narrative</label>
                    <textarea
                      value={editState.currentData.narrative || ''}
                      onChange={(e) => handleFieldChange('narrative', e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                      class="w-full p-1 border rounded mt-1 h-32"
                      disabled={isSaving}
                    />
                  </div>
                  <div class="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      class={`px-4 py-2 text-sm rounded ${
                        isSaving
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      class="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium">
                        {exp.title}
                      </div>
                      <div class="text-gray-600">
                        {exp.company}
                      </div>
                      {exp.location && (
                        <div class="text-sm text-gray-500 mt-1">
                          {exp.location}
                        </div>
                      )}
                      {(exp.start_date || exp.end_date) && (
                        <p class="text-sm text-gray-500 mt-1">
                          {formatDateRange(exp.start_date, exp.end_date)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartEdit(exp)}
                      class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                  </div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul class="mt-2 list-disc list-inside">
                      {exp.responsibilities.map((resp, i) => (
                        <li key={i} class="text-sm text-gray-600">{resp}</li>
                      ))}
                    </ul>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div class="mt-2">
                      <h4 class="text-sm font-medium text-gray-700">Achievements</h4>
                      <ul class="mt-1 list-disc list-inside">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} class="text-sm text-gray-600">{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exp.narrative && (
                    <div class="mt-2">
                      <h4 class="text-sm font-medium text-gray-700">Narrative</h4>
                      <p class="text-sm text-gray-600 mt-1">{exp.narrative}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 