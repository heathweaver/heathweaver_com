import { Head } from "fresh/runtime";
import Navigation from "../components/Navigation.tsx";
import { withClient } from "@db/postgres-base.ts";
import LinkedInButton from "../islands/LinkedInButton.tsx";
import ExperienceSection from "../islands/ExperienceSection.tsx";
import ContactSection from "../islands/ContactSection.tsx";
import { formatEducationDisplay, getUserProfile } from "../lib/db/user-db.ts";
import { formatDateRange } from "../lib/utils/date.ts";
import { define } from "../utils.ts";

interface ProfileData {
  user: {
    name: string;
    email: string;
    credits: number;
  };
  profile: {
    experience?: Array<{
      id: number;
      title: string;
      company: string;
      start_date: string;
      end_date: string | null;
      location: string | null;
      responsibilities: string[] | null;
      achievements: string[] | null;
      narrative: string | null;
    }>;
    education?: Array<{
      id: number;
      institution: string;
      degree: string | null;
      field: string;
      start_date: string | null;
      end_date: string | null;
      location: string | null;
      achievements: string[] | null;
    }>;
    skills?: Array<{
      id: number;
      category: string;
      skills: string[];
    }>;
    awards?: Array<{
      id: number;
      title: string;
      issuer: string | null;
      date: string | null;
      description: string | null;
    }>;
    contact?: {
      fullName: string;
      email: string | null;
      phone: string | null;
      location: string | null;
      linkedin: string | null;
      phoneNumbers: {
        US?: string | null;
        BE?: string | null;
      } | null;
    } | null;
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/login" },
      });
    }

    // Get full user data from database using the ID from session
    const dbUser = await withClient(async (sql) => {
      return await sql<{
        id: number;
        first_name: string;
        last_name: string;
        email: string;
      }[]>`
        SELECT id, first_name, last_name, email FROM users WHERE id = ${user.$id}
      `;
    });

    if (!dbUser.length) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/login?error=user_not_found" },
      });
    }

    const userData = dbUser[0];

    // Get user profile data
    const profile = await getUserProfile(user.$id);

    return { data: {
      user: {
        name: `${userData.first_name} ${userData.last_name}`.trim(),
        email: userData.email,
        credits: 0,
      },
      profile,
    } };
  },
});

export default define.page<typeof handler>(function Profile(props) {
  const data = props.data;
  return (
    <>
      <Head>
        <title>Profile - AI CV Generator</title>
        <meta
          name="description"
          content="Manage your AI CV Generator profile and settings"
        />
      </Head>
      <div class="min-h-screen bg-gray-50">
        <Navigation />
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg p-6">
              <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold text-gray-900">
                  Profile Settings
                </h1>
                <div class="flex items-center space-x-4">
                  <span class="text-sm text-gray-500">
                    Credits: {data.user.credits}
                  </span>
                </div>
              </div>

              <div class="flex space-x-4 mb-8">
                <LinkedInButton />
                <button
                  type="button"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <svg
                    class="h-5 w-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload CV/Resume
                </button>
              </div>

              <div class="pt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Contact Information
                </h2>
                <ContactSection contact={data.profile?.contact || null} />
              </div>

              <div class="pt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Professional Experience
                </h2>
                <ExperienceSection
                  experiences={data.profile?.experience || []}
                />
              </div>

              <div class="pt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Education
                </h2>
                <div id="education-list" class="space-y-4">
                  {data.profile?.education?.map((edu) => (
                    <div key={edu.id} class="border rounded-lg p-4">
                      <h3 class="font-medium">{edu.institution}</h3>
                      <p class="text-gray-600">{formatEducationDisplay(edu)}</p>
                      {(edu.start_date || edu.end_date) && (
                        <p class="text-sm text-gray-500 mt-1">
                          {formatDateRange(edu.start_date, edu.end_date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div class="pt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Skills</h2>
                <div id="skills-list" class="space-y-4">
                  {data.profile?.skills?.map((skill) => (
                    <div key={skill.id} class="border rounded-lg p-4">
                      <h3 class="font-medium text-gray-900">
                        {skill.category}
                      </h3>
                      <div class="mt-2 flex flex-wrap gap-2">
                        {skill.skills.map((skillName, i) => (
                          <span
                            key={i}
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skillName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div class="pt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Awards & Certifications
                </h2>
                <div id="awards-list" class="space-y-4">
                  {data.profile?.awards?.map((award) => (
                    <div key={award.id} class="border rounded-lg p-4">
                      <h3 class="font-medium">{award.title}</h3>
                      {award.issuer && (
                        <p class="text-gray-600">Issued by: {award.issuer}</p>
                      )}
                      {award.date && (
                        <p class="text-sm text-gray-500 mt-1">
                          {new Date(award.date).toLocaleDateString()}
                        </p>
                      )}
                      {award.description && (
                        <p class="text-sm text-gray-600 mt-2">
                          {award.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div class="pt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Publications
                </h2>
                <div id="publications-list" class="space-y-4">
                  {/* Publications entries will be dynamically added here */}
                </div>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Publication
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
