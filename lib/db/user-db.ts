import postgres from "postgres";
import { withTransaction } from "./postgres-base.ts";

type Sql = postgres.Sql;

// Generate a 10-digit user ID (numeric only for simplicity)
function generateUserId(): string {
  return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
}

export interface CreateUserParams {
  email: string;
  firstName?: string;
  lastName?: string;
  provider: string;
  providerId: string;
  profileData?: {
    avatarUrl?: string;
    headline?: string;
    currentPosition?: string;
    location?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  provider: string;
  providerId: string;
  profile?: {
    avatarUrl?: string;
    headline?: string;
    currentPosition?: string;
    location?: string;
  };
  credits?: {
    balance: number;
    totalEarned: number;
  };
  subscription?: {
    planType: string;
    status: string;
  };
}

export interface UserProfile {
  experience: Array<{
    id: number;
    company: string;
    title: string;
    start_date: string;
    end_date: string | null;
    location: string | null;
    responsibilities: string[] | null;
    achievements: string[] | null;
    narrative: string | null;
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string | null;
    field: string;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    achievements: string[] | null;
  }>;
  awards: Array<{
    id: number;
    title: string;
    issuer: string | null;
    date: string | null;
    description: string | null;
  }>;
  skills: Array<{
    id: number;
    category: string;
    skills: string[];
  }>;
  contact: {
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
}

// Helper function to safely format education display
export function formatEducationDisplay(
  edu: UserProfile["education"][0],
): string {
  if (!edu.degree || edu.degree.trim() === "") {
    return edu.field;
  }
  return `${edu.degree} in ${edu.field}`;
}

// Helper function to safely format date range
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
): string {
  const start = startDate ? new Date(startDate).toLocaleDateString() : "";
  const end = endDate ? new Date(endDate).toLocaleDateString() : "Present";
  return `${start} - ${end}`;
}

export async function createUser(params: CreateUserParams): Promise<User> {
  return await withTransaction(async (client: Sql) => {
    const userId = generateUserId();

    // Create user
    const userResult: Array<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      provider: string;
      provider_id: string;
    }> = await client`
      INSERT INTO users (
        id, email, first_name, last_name, provider, provider_id
      ) VALUES (
        ${userId}, ${params.email}, ${params.firstName ?? null}, ${params.lastName ?? null}, 
        ${params.provider}, ${params.providerId}
      )
      RETURNING *
    `;

    // Create user profile
    await client`
      INSERT INTO user_profiles (
        user_id, avatar_url, headline, current_position, location
      ) VALUES (
        ${userId}, ${params.profileData?.avatarUrl ?? null}, ${params.profileData?.headline ?? null},
        ${params.profileData?.currentPosition ?? null}, ${params.profileData?.location ?? null}
      )
    `;

    // Initialize free subscription
    await client`
      INSERT INTO subscriptions (
        user_id, plan_type, status
      ) VALUES (
        ${userId}, 'free', 'active'
      )
    `;

    // Initialize credits
    await client`
      INSERT INTO credits (
        user_id, balance, total_earned
      ) VALUES (
        ${userId}, 10, 10
      )
    `;

    // Record welcome credits transaction
    await client`
      INSERT INTO credit_transactions (
        user_id, amount, type, description
      ) VALUES (
        ${userId}, 10, 'earned', 'Welcome bonus credits'
      )
    `;

    return mapUserResultFromObject(userResult[0]);
  });
}

export async function getUserByProviderId(
  provider: string,
  providerId: string,
): Promise<User | null> {
  return await withTransaction(async (client: Sql) => {
    const result: Array<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      provider: string;
      provider_id: string;
      avatar_url?: string;
      headline?: string;
      current_position?: string;
      location?: string;
      balance?: number;
      total_earned?: number;
      plan_type?: string;
      status?: string;
    }> = await client`
      SELECT u.id, u.email, u.first_name, u.last_name, u.provider, u.provider_id,
             up.avatar_url, up.headline, up.current_position, up.location,
             c.balance, c.total_earned, s.plan_type, s.status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN credits c ON u.id = c.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.provider = ${provider} AND u.provider_id = ${providerId}
    `;

    return result[0] ? mapUserResultFromObject(result[0]) : null;
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await withTransaction(async (client: Sql) => {
    const result: Array<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      provider: string;
      provider_id: string;
      avatar_url?: string;
      headline?: string;
      current_position?: string;
      location?: string;
      balance?: number;
      total_earned?: number;
      plan_type?: string;
      status?: string;
    }> = await client`
      SELECT u.id, u.email, u.first_name, u.last_name, u.provider, u.provider_id,
             up.avatar_url, up.headline, up.current_position, up.location,
             c.balance, c.total_earned, s.plan_type, s.status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN credits c ON u.id = c.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.email = ${email}
    `;

    return result[0] ? mapUserResultFromObject(result[0]) : null;
  });
}

// Helper function to map database result to User interface
function mapUserResultFromObject(row: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  provider: string;
  provider_id: string;
  avatar_url?: string;
  headline?: string;
  current_position?: string;
  location?: string;
  balance?: number;
  total_earned?: number;
  plan_type?: string;
  status?: string;
}): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    provider: row.provider,
    providerId: row.provider_id,
    profile: {
      avatarUrl: row.avatar_url,
      headline: row.headline,
      currentPosition: row.current_position,
      location: row.location,
    },
    credits: {
      balance: row.balance || 0,
      totalEarned: row.total_earned || 0,
    },
    subscription: {
      planType: row.plan_type || 'free',
      status: row.status || 'active',
    },
  };
}

export async function updateUserWithLinkedIn(userId: string, memberData: {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  localizedHeadline?: string;
  localizedCurrentPosition?: string;
  industry?: string;
  location?: { name: string };
  summary?: string;
  profilePicture?: {
    "displayImage~"?: {
      elements?: Array<{
        identifiers?: Array<{ identifier: string }>;
      }>;
    };
  };
}) {
  return await withTransaction(async (client: Sql) => {
    await client`
      UPDATE users 
      SET 
        provider = 'linkedin',
        provider_id = ${memberData.id},
        first_name = ${memberData.localizedFirstName},
        last_name = ${memberData.localizedLastName},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id
    `;

    await client`
      INSERT INTO user_profiles (
        user_id,
        linkedin_profile_url,
        linkedin_data,
        headline,
        current_position,
        industry,
        location,
        bio,
        avatar_url,
        updated_at
      )
      VALUES (
        ${userId},
        ${`https://www.linkedin.com/in/${memberData.id}`},
        ${JSON.stringify(memberData)},
        ${memberData.localizedHeadline || null},
        ${memberData.localizedCurrentPosition || null},
        ${memberData.industry || null},
        ${memberData.location?.name || null},
        ${memberData.summary || null},
        ${
      memberData.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers
        ?.[0]?.identifier || null
    },
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        linkedin_profile_url = EXCLUDED.linkedin_profile_url,
        linkedin_data = EXCLUDED.linkedin_data,
        headline = EXCLUDED.headline,
        current_position = EXCLUDED.current_position,
        industry = EXCLUDED.industry,
        location = EXCLUDED.location,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP
    `;
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return await withTransaction(async (client: Sql) => {
    // Get professional experience
    const experienceResult: Array<{
      id: number;
      company: string;
      title: string;
      start_date: string;
      end_date?: string;
      location?: string;
      responsibilities?: string[];
      achievements?: string[];
      narrative?: string;
    }> = await client`
      SELECT * FROM professional_experience WHERE user_id = ${userId} ORDER BY start_date DESC
    `;

    // Get education
    const educationResult: Array<{
      id: number;
      institution: string;
      degree: string;
      field: string;
      start_date?: string;
      end_date?: string;
      location?: string;
      achievements?: string[];
    }> = await client`
      SELECT * FROM education WHERE user_id = ${userId} ORDER BY start_date DESC
    `;

    // Get awards
    const awardsResult: Array<{
      id: number;
      title: string;
      issuer?: string;
      date?: string;
      description?: string;
    }> = await client`
      SELECT * FROM awards WHERE user_id = ${userId} ORDER BY date DESC
    `;

    // Get skills
    const skillsResult: Array<{
      id: number;
      category: string;
      skills: string[];
    }> = await client`
      SELECT * FROM skills WHERE user_id = ${userId}
    `;

    // Get contact info
    const contactResult: Array<{
      id: number;
      full_name: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      phone_numbers?: {
        BE?: string;
        US?: string;
      };
    }> = await client`
      SELECT * FROM contact_info WHERE user_id = ${userId}
    `;

    return {
      experience: experienceResult.map((exp) => ({
        id: exp.id,
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date,
        end_date: exp.end_date ?? null,
        location: exp.location ?? null,
        responsibilities: exp.responsibilities ?? null,
        achievements: exp.achievements ?? null,
        narrative: exp.narrative ?? null,
      })),
      education: educationResult.map((edu) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree ?? null,
        field: edu.field,
        start_date: edu.start_date ?? null,
        end_date: edu.end_date ?? null,
        location: edu.location ?? null,
        achievements: edu.achievements ?? null,
      })),
      awards: awardsResult.map((award) => ({
        id: award.id,
        title: award.title,
        issuer: award.issuer ?? null,
        date: award.date ?? null,
        description: award.description ?? null,
      })),
      skills: skillsResult.map((skill) => ({
        id: skill.id,
        category: skill.category,
        skills: skill.skills,
      })),
      contact: contactResult[0]
        ? {
          fullName: contactResult[0].full_name,
          email: contactResult[0].email ?? null,
          phone: contactResult[0].phone ?? null,
          location: contactResult[0].location ?? null,
          linkedin: contactResult[0].linkedin ?? null,
          phoneNumbers: contactResult[0].phone_numbers ?? null,
        }
        : null,
    };
  });
}

export interface ExperienceUpdate {
  id: number; 
  userId: number;
  field: string;
  value: string | null;
}

export async function updateExperienceField(
  { id, userId, field, value }: ExperienceUpdate,
) {
  console.log("DB: Updating experience field:", { id, userId, field, value });

  return await withTransaction(async (client: Sql) => {
    // First verify this experience belongs to the user
    const result: Array<{ user_id: number }> = await client`
      SELECT user_id FROM professional_experience WHERE id = ${id}
    `;

    if (!result.length || result[0].user_id !== userId) {
      throw new Error("Unauthorized: Experience does not belong to user");
    }

    // Update the specified field - use dynamic SQL with postgres package
    // Note: This is safe because field names are validated by the caller
    const updateResult = await client.unsafe(
      `UPDATE professional_experience SET ${field} = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [value, id, userId]
    );

    if (!updateResult.length) {
      throw new Error("Failed to update experience");
    }

    console.log("DB: Successfully updated experience:", updateResult[0]);
    return updateResult[0];
  });
}
