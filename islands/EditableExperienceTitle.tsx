import { useState } from "preact/hooks";

interface EditableExperienceTitleProps {
  id: number;
  initialTitle: string;
  onSave: (id: number, newTitle: string) => Promise<void>;
}

export default function EditableExperienceTitle(
  { id, initialTitle, onSave }: EditableExperienceTitleProps,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    console.log("EditableTitle: Starting save...", { id, title, initialTitle });
    if (title.trim() === initialTitle.trim()) {
      console.log("EditableTitle: No changes made, canceling save");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      console.log("EditableTitle: Calling onSave...", { id, title });
      await onSave(id, title);
      console.log("EditableTitle: Save successful");
      setIsEditing(false);
    } catch (error) {
      console.error("EditableTitle: Failed to save:", error);
      setTitle(initialTitle);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    console.log("EditableTitle: Key pressed:", e.key);
    if (e.key === "Enter") {
      console.log("EditableTitle: Enter pressed, saving...");
      e.preventDefault();
      await handleSave();
    } else if (e.key === "Escape") {
      console.log("EditableTitle: Escape pressed, canceling...");
      e.preventDefault();
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div class="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const newValue = (e.target as HTMLInputElement).value;
            console.log("EditableTitle: Input changed:", { newValue });
            setTitle(newValue);
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          class="font-medium text-gray-900 bg-white border-b border-gray-300 focus:border-blue-500 focus:ring-0 p-0 w-full"
          autoFocus
        />
        <button
          onClick={async () => {
            console.log("EditableTitle: Save button clicked");
            await handleSave();
          }}
          disabled={isSaving}
          class="text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <h3
      class="font-medium cursor-pointer hover:text-blue-600 transition-colors"
      onClick={() => {
        console.log("EditableTitle: Starting edit mode");
        setIsEditing(true);
      }}
    >
      {title}
    </h3>
  );
}
