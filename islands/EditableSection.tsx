import { JSX } from "preact";
import { useState, useEffect } from "preact/hooks";

interface EditableSectionProps {
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
  children: JSX.Element;
  multiline?: boolean;
}

export default function EditableSection({ isEditing, value, onChange, children, multiline }: EditableSectionProps) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  if (!isEditing) {
    return children;
  }

  return (
    <div class="relative group flex-1">
      <textarea
        value={editValue}
        onChange={(e) => {
          const newValue = (e.target as HTMLTextAreaElement).value;
          setEditValue(newValue);
          onChange(newValue);
        }}
        rows={multiline ? 2 : 1}
        class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none overflow-hidden"
        style={{
          height: multiline ? 'auto' : '2.25rem',
          minHeight: multiline ? '4rem' : '2.25rem'
        }}
        onInput={(e) => {
          if (!multiline) return;
          const target = e.target as HTMLTextAreaElement;
          target.style.height = '4rem'; // Reset to minimum height
          target.style.height = Math.max(target.scrollHeight, 64) + 'px'; // 64px = 4rem
        }}
      />
    </div>
  );
} 