import { useState } from "preact/hooks";

interface Contact {
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  phoneNumbers: {
    US?: string | null;
    BE?: string | null;
  } | null;
}

interface EditState {
  currentData: Contact;
}

export default function ContactSection({ contact }: { contact: Contact | null }) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = (contact: Contact) => {
    setEditState({
      currentData: { ...contact }
    });
  };

  const handleCancel = () => {
    setEditState(null);
  };

  const handleFieldChange = (field: keyof Contact, value: any) => {
    if (!editState) return;
    setEditState({
      ...editState,
      currentData: {
        ...editState.currentData,
        [field]: value
      }
    });
  };

  const handlePhoneNumberChange = (country: 'US' | 'BE', value: string) => {
    if (!editState) return;
    setEditState({
      ...editState,
      currentData: {
        ...editState.currentData,
        phoneNumbers: {
          ...(editState.currentData.phoneNumbers || {}),
          [country]: value || null
        }
      }
    });
  };

  const handleSave = async () => {
    if (!editState) return;

    setIsSaving(true);
    try {
      const fields = ['fullName', 'email', 'phone', 'location', 'linkedin', 'phoneNumbers'];
      
      for (const field of fields) {
        const response = await fetch(`/api/contact/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field,
            value: editState.currentData[field as keyof Contact]
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
      console.error('Failed to save contact:', error);
      setEditState(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <div class="border rounded-lg p-4">
      {editState ? (
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={editState.currentData.fullName}
              onChange={(e) => handleFieldChange('fullName', e.currentTarget.value)}
              class="w-full p-1 border rounded mt-1"
              disabled={isSaving}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={editState.currentData.email || ''}
              onChange={(e) => handleFieldChange('email', e.currentTarget.value)}
              class="w-full p-1 border rounded mt-1"
              disabled={isSaving}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={editState.currentData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.currentTarget.value)}
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
              class="w-full p-1 border rounded mt-1"
              disabled={isSaving}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">LinkedIn URL</label>
            <input
              type="url"
              value={editState.currentData.linkedin || ''}
              onChange={(e) => handleFieldChange('linkedin', e.currentTarget.value)}
              class="w-full p-1 border rounded mt-1"
              disabled={isSaving}
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">US Phone</label>
              <input
                type="tel"
                value={editState.currentData.phoneNumbers?.US || ''}
                onChange={(e) => handlePhoneNumberChange('US', e.currentTarget.value)}
                class="w-full p-1 border rounded mt-1"
                disabled={isSaving}
                placeholder="+1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">BE Phone</label>
              <input
                type="tel"
                value={editState.currentData.phoneNumbers?.BE || ''}
                onChange={(e) => handlePhoneNumberChange('BE', e.currentTarget.value)}
                class="w-full p-1 border rounded mt-1"
                disabled={isSaving}
                placeholder="+32"
              />
            </div>
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
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Full Name</label>
                <p class="mt-1 text-gray-900">{contact.fullName}</p>
              </div>
              {contact.email && (
                <div>
                  <label class="block text-sm font-medium text-gray-700">Email</label>
                  <p class="mt-1 text-gray-900">{contact.email}</p>
                </div>
              )}
              {contact.phone && (
                <div>
                  <label class="block text-sm font-medium text-gray-700">Phone</label>
                  <p class="mt-1 text-gray-900">{contact.phone}</p>
                </div>
              )}
              {contact.location && (
                <div>
                  <label class="block text-sm font-medium text-gray-700">Location</label>
                  <p class="mt-1 text-gray-900">{contact.location}</p>
                </div>
              )}
              {contact.linkedin && (
                <div>
                  <label class="block text-sm font-medium text-gray-700">LinkedIn</label>
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" class="mt-1 text-blue-600 hover:text-blue-800">
                    {contact.linkedin}
                  </a>
                </div>
              )}
              {contact.phoneNumbers?.US && (
                <div>
                  <label class="block text-sm font-medium text-gray-700">US Phone</label>
                  <p class="mt-1 text-gray-900">{contact.phoneNumbers.US}</p>
                </div>
              )}
              {contact.phoneNumbers?.BE && (
                <div>
                  <label class="block text-sm font-medium text-gray-700">BE Phone</label>
                  <p class="mt-1 text-gray-900">{contact.phoneNumbers.BE}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleStartEdit(contact)}
              class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 