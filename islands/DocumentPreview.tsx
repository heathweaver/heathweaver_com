import { cvSignal } from "./shared.ts";
import { useState } from "preact/hooks";
import EditableSection from "./EditableSection.tsx";

export default function DocumentPreview() {
  const cv = cvSignal.value;
  const [isEditing, setIsEditing] = useState(false);

  if (!cv) {
    return (
      <div class="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div class="text-center">
          <p class="text-gray-500">Select a CV template to preview</p>
        </div>
      </div>
    );
  }

  // Format dates to Month YYYY
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "Present";
    const date = new Date(dateStr);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/cv/pdf?id=${cv.id}`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.basicInfo.name.replace(/\s+/g, "_")}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/cv/${cv.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cv),
      });

      if (!response.ok) throw new Error("Failed to save CV");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving CV:", error);
    }
  };

  const handleCancel = () => {
    // Reset CV to original state
    if (cv.id) {
      fetch(`/api/cv/${cv.id}`).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          cvSignal.value = data;
        }
      });
    }
    setIsEditing(false);
  };

  return (
    <div class="flex flex-col h-[calc(100vh-8rem)] print:!p-0 print:!m-0 print:h-auto print:bg-white">
      <style>
        {`
        @media print {
          body > *:not(.cv-preview-root) {
            display: none !important;
          }
          .cv-preview-root {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          @page {
            size: letter;
            margin: 0;
          }
          .cv-content {
            page-break-inside: auto;
          }
          h2 {
            page-break-after: avoid;
          }
          h3 {
            page-break-after: avoid;
          }
          ul {
            page-break-inside: avoid;
          }
          li {
            page-break-inside: avoid;
          }
        }
      `}
      </style>

      {/* Main content area */}
      <div class="flex-1">
        {/* CV Preview and Editor */}
        <div class="flex-1 flex flex-col">
          {/* Menu Bar */}
          <div class="bg-white shadow-sm border-b">
            <div class="px-4 py-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  {/* Primary Actions */}
                  <div class="flex items-center space-x-2 pr-4 border-r">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      {isEditing ? "Preview" : "Edit CV"}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!isEditing}
                      class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    >
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={!isEditing}
                      class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Output Actions */}
                  <div class="flex items-center space-x-2 px-4 border-r">
                    <button
                      onClick={handleDownload}
                      class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download PDF
                    </button>
                    <button class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share
                    </button>
                  </div>

                  {/* Version Actions */}
                  <div class="flex items-center space-x-2">
                    <button class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Regenerate
                    </button>
                    <button class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document */}
          <div class="flex-1 overflow-auto bg-gray-100 rounded-lg p-8 print:!p-0 print:!m-0 print:!overflow-visible print:!bg-white print:!rounded-none">
            <div class="mx-auto">
              {/* CV Content */}
              <div
                class="bg-white shadow-xl print:!shadow-none cv-content"
                style={{
                  width: "8.5in",
                  minHeight: "11in",
                  padding: "0.75in",
                  backgroundColor: "white",
                }}
              >
                {/* Name */}
                <EditableSection
                  isEditing={isEditing}
                  value={cv.basicInfo.name}
                  onChange={(value) => {
                    cvSignal.value = {
                      ...cv,
                      basicInfo: { ...cv.basicInfo, name: value },
                    };
                  }}
                >
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {cv.basicInfo.name}
                  </h1>
                </EditableSection>

                {/* Contact Info */}
                <div class="text-sm text-gray-600 mb-8 flex flex-wrap gap-x-4">
                  <EditableSection
                    isEditing={isEditing}
                    value={cv.basicInfo.email}
                    onChange={(value) => {
                      cvSignal.value = {
                        ...cv,
                        basicInfo: { ...cv.basicInfo, email: value },
                      };
                    }}
                  >
                    <div>{cv.basicInfo.email}</div>
                  </EditableSection>
                  {cv.basicInfo.phone && (
                    <EditableSection
                      isEditing={isEditing}
                      value={cv.basicInfo.phone}
                      onChange={(value) => {
                        cvSignal.value = {
                          ...cv,
                          basicInfo: { ...cv.basicInfo, phone: value },
                        };
                      }}
                    >
                      <div>{cv.basicInfo.phone}</div>
                    </EditableSection>
                  )}
                  {cv.basicInfo.linkedin && (
                    <EditableSection
                      isEditing={isEditing}
                      value={cv.basicInfo.linkedin}
                      onChange={(value) => {
                        cvSignal.value = {
                          ...cv,
                          basicInfo: { ...cv.basicInfo, linkedin: value },
                        };
                      }}
                    >
                      <a
                        href={cv.basicInfo.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-emerald-600 hover:text-emerald-700"
                      >
                        LinkedIn Profile
                      </a>
                    </EditableSection>
                  )}
                </div>

                {/* Career Section */}
                <div class="mb-8">
                  <h2 class="text-xl font-bold text-gray-900 mb-4 pb-1 border-b">
                    Professional Experience
                  </h2>
                  {cv.employmentHistory.map((job, jobIndex) => (
                    <div key={`${job.company}-${job.title}`} class="mb-6">
                      <div class="mb-1">
                        <EditableSection
                          isEditing={isEditing}
                          value={`${job.title} at ${job.company}`}
                          onChange={(value) => {
                            const [title, ...rest] = value.split(" at ");
                            const company = rest.join(" at ");
                            const updatedHistory = [...cv.employmentHistory];
                            updatedHistory[jobIndex] = {
                              ...job,
                              title,
                              company,
                            };
                            cvSignal.value = {
                              ...cv,
                              employmentHistory: updatedHistory,
                            };
                          }}
                        >
                          <h3 class="text-base font-semibold text-gray-900">
                            {job.title} at {job.company}
                          </h3>
                        </EditableSection>
                        <div class="text-sm text-gray-600">
                          <EditableSection
                            isEditing={isEditing}
                            value={`${formatDate(job.start_date)} – ${
                              job.end_date === "Present"
                                ? "Present"
                                : formatDate(job.end_date)
                            }`}
                            onChange={(value) => {
                              const [start, end] = value.split(" – ");
                              const updatedHistory = [...cv.employmentHistory];
                              updatedHistory[jobIndex] = {
                                ...job,
                                start_date: start,
                                end_date: end,
                              };
                              cvSignal.value = {
                                ...cv,
                                employmentHistory: updatedHistory,
                              };
                            }}
                          >
                            <span>
                              {formatDate(job.start_date)} –{" "}
                              {job.end_date === "Present"
                                ? "Present"
                                : formatDate(job.end_date)}
                            </span>
                          </EditableSection>
                          {job.location && (
                            <EditableSection
                              isEditing={isEditing}
                              value={job.location}
                              onChange={(value) => {
                                const updatedHistory = [
                                  ...cv.employmentHistory,
                                ];
                                updatedHistory[jobIndex] = {
                                  ...job,
                                  location: value,
                                };
                                cvSignal.value = {
                                  ...cv,
                                  employmentHistory: updatedHistory,
                                };
                              }}
                            >
                              <span>| {job.location}</span>
                            </EditableSection>
                          )}
                        </div>
                      </div>

                      <ul class="mt-2 space-y-1 text-sm text-gray-600">
                        {job.bulletPoints.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} class="flex items-start">
                            <span class="mr-2 flex-shrink-0">•</span>
                            <EditableSection
                              isEditing={isEditing}
                              value={bullet.content}
                              multiline={true}
                              onChange={(value) => {
                                const updatedHistory = [
                                  ...cv.employmentHistory,
                                ];
                                updatedHistory[jobIndex] = {
                                  ...job,
                                  bulletPoints: job.bulletPoints.map((b, i) =>
                                    i === bulletIndex
                                      ? { ...b, content: value }
                                      : b
                                  ),
                                };
                                cvSignal.value = {
                                  ...cv,
                                  employmentHistory: updatedHistory,
                                };
                              }}
                            >
                              <span class="flex-1 whitespace-pre-line">
                                {bullet.content}
                              </span>
                            </EditableSection>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Education */}
                {cv.education && cv.education.length > 0 && (
                  <div class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4 pb-1 border-b">
                      Education
                    </h2>
                    {cv.education.map((edu, eduIndex) => (
                      <div key={edu.institution} class="mb-4">
                        <div>
                          <EditableSection
                            isEditing={isEditing}
                            value={edu.institution}
                            onChange={(value) => {
                              const updatedEducation = [...cv.education];
                              updatedEducation[eduIndex] = {
                                ...edu,
                                institution: value,
                              };
                              cvSignal.value = {
                                ...cv,
                                education: updatedEducation,
                              };
                            }}
                          >
                            <div class="text-base font-semibold text-gray-900">
                              {edu.institution}
                            </div>
                          </EditableSection>
                          <div class="text-sm text-gray-600">
                            <EditableSection
                              isEditing={isEditing}
                              value={`${edu.degree} in ${edu.field}`}
                              onChange={(value) => {
                                const [degree, ...rest] = value.split(" in ");
                                const field = rest.join(" in ");
                                const updatedEducation = [...cv.education];
                                updatedEducation[eduIndex] = {
                                  ...edu,
                                  degree,
                                  field,
                                };
                                cvSignal.value = {
                                  ...cv,
                                  education: updatedEducation,
                                };
                              }}
                            >
                              <div>{edu.degree} in {edu.field}</div>
                            </EditableSection>
                            <EditableSection
                              isEditing={isEditing}
                              value={`${formatDate(edu.start_date)} – ${
                                edu.end_date
                                  ? formatDate(edu.end_date)
                                  : "Present"
                              }`}
                              onChange={(value) => {
                                const [start, end] = value.split(" – ");
                                const updatedEducation = [...cv.education];
                                updatedEducation[eduIndex] = {
                                  ...edu,
                                  start_date: start === "Present" ? "" : start,
                                  end_date: end === "Present" ? "" : end,
                                };
                                cvSignal.value = {
                                  ...cv,
                                  education: updatedEducation,
                                };
                              }}
                            >
                              <span>
                                {formatDate(edu.start_date)} – {edu.end_date
                                  ? formatDate(edu.end_date)
                                  : "Present"}
                              </span>
                            </EditableSection>
                            {edu.location && (
                              <EditableSection
                                isEditing={isEditing}
                                value={edu.location}
                                onChange={(value) => {
                                  const updatedEducation = [...cv.education];
                                  updatedEducation[eduIndex] = {
                                    ...edu,
                                    location: value,
                                  };
                                  cvSignal.value = {
                                    ...cv,
                                    education: updatedEducation,
                                  };
                                }}
                              >
                                <span>| {edu.location}</span>
                              </EditableSection>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {cv.skills && cv.skills.length > 0 && (
                  <div>
                    <h2 class="text-xl font-bold text-gray-900 mb-4 pb-1 border-b">
                      Skills
                    </h2>
                    <div class="space-y-2">
                      {cv.skills.map((skillGroup, groupIndex) => (
                        <div key={skillGroup.category} class="text-sm">
                          <EditableSection
                            isEditing={isEditing}
                            value={skillGroup.category}
                            onChange={(value) => {
                              const updatedSkills = [...cv.skills];
                              updatedSkills[groupIndex] = {
                                ...skillGroup,
                                category: value,
                              };
                              cvSignal.value = {
                                ...cv,
                                skills: updatedSkills,
                              };
                            }}
                          >
                            <span class="font-semibold text-gray-900">
                              {skillGroup.category}:
                            </span>
                          </EditableSection>
                          <EditableSection
                            isEditing={isEditing}
                            value={skillGroup.skills.join(" • ")}
                            onChange={(value) => {
                              const updatedSkills = [...cv.skills];
                              updatedSkills[groupIndex] = {
                                ...skillGroup,
                                skills: value.split(" • ").map((s) =>
                                  s.trim()
                                ).filter(Boolean),
                              };
                              cvSignal.value = {
                                ...cv,
                                skills: updatedSkills,
                              };
                            }}
                          >
                            <span class="text-gray-600">
                              {skillGroup.skills.join(" • ")}
                            </span>
                          </EditableSection>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
