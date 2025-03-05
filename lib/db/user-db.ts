import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { withTransaction } from "./postgres-base.ts";

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
export function formatEducationDisplay(edu: UserProfile['education'][0]): string {
  if (!edu.degree || edu.degree.trim() === '') {
    return edu.field;
  }
  return `${edu.degree} in ${edu.field}`;
}

// Helper function to safely format date range
export function formatDateRange(startDate: string | null, endDate: string | null): string {
  const start = startDate ? new Date(startDate).toLocaleDateString() : '';
  const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present';
  return `${start} - ${end}`;
}

export async function createUser(params: CreateUserParams): Promise<User> {
  return await withTransaction(async (client: Client) => {
    const userId = generateUserId();

    // Create user
    const userResult = await client.queryArray`
      INSERT INTO users (
        id, email, first_name, last_name, provider, provider_id
      ) VALUES (
        ${userId}, ${params.email}, ${params.firstName}, ${params.lastName}, 
        ${params.provider}, ${params.providerId}
      )
      RETURNING *
    `;

    // Create user profile
    await client.queryArray`
      INSERT INTO user_profiles (
        user_id, avatar_url, headline, current_position, location
      ) VALUES (
        ${userId}, ${params.profileData?.avatarUrl}, ${params.profileData?.headline},
        ${params.profileData?.currentPosition}, ${params.profileData?.location}
      )
    `;

    // Initialize free subscription
    await client.queryArray`
      INSERT INTO subscriptions (
        user_id, plan_type, status
      ) VALUES (
        ${userId}, 'free', 'active'
      )
    `;

    // Initialize credits
    await client.queryArray`
      INSERT INTO credits (
        user_id, balance, total_earned
      ) VALUES (
        ${userId}, 10, 10
      )
    `;

    // Record welcome credits transaction
    await client.queryArray`
      INSERT INTO credit_transactions (
        user_id, amount, type, description
      ) VALUES (
        ${userId}, 10, 'earned', 'Welcome bonus credits'
      )
    `;

    return mapUserResult(userResult.rows[0]);
  });
}

export async function getUserByProviderId(provider: string, providerId: string): Promise<User | null> {
  return await withTransaction(async (client: Client) => {
    const result = await client.queryArray`
      SELECT u.*, up.*, c.balance, c.total_earned, s.plan_type, s.status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN credits c ON u.id = c.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.provider = ${provider} AND u.provider_id = ${providerId}
    `;
    
    return result.rows[0] ? mapUserResult(result.rows[0]) : null;
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await withTransaction(async (client: Client) => {
    const result = await client.queryArray`
      SELECT u.*, up.*, c.balance, c.total_earned, s.plan_type, s.status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN credits c ON u.id = c.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.email = ${email}
    `;
    
    return result.rows[0] ? mapUserResult(result.rows[0]) : null;
  });
}

// Helper function to map database result to User interface
function mapUserResult(row: unknown[]): User {
  return {
    id: row[0] as string,
    email: row[1] as string,
    firstName: row[2] as string,
    lastName: row[3] as string,
    provider: row[4] as string,
    providerId: row[5] as string,
    profile: {
      avatarUrl: row[7] as string,
      headline: row[8] as string,
      currentPosition: row[9] as string,
      location: row[10] as string,
    },
    credits: {
      balance: row[11] as number,
      totalEarned: row[12] as number,
    },
    subscription: {
      planType: row[13] as string,
      status: row[14] as string,
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
  return withTransaction(async (client: Client) => {
    await client.queryObject`
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

    await client.queryObject`
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
        ${memberData.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier || null},
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
  return withTransaction(async (client: Client) => {
    // Get professional experience
    const experienceResult = await client.queryObject<{
      id: number;
      company: string;
      title: string;
      start_date: string;
      end_date?: string;
      location?: string;
      responsibilities?: string[];
      achievements?: string[];
      narrative?: string;
    }>(
      `SELECT * FROM professional_experience WHERE user_id = $1 ORDER BY start_date DESC`,
      [userId]
    );

    // Get education
    const educationResult = await client.queryObject<{
      id: number;
      institution: string;
      degree: string;
      field: string;
      start_date?: string;
      end_date?: string;
      location?: string;
      achievements?: string[];
    }>(
      `SELECT * FROM education WHERE user_id = $1 ORDER BY start_date DESC`,
      [userId]
    );

    // Get awards
    const awardsResult = await client.queryObject<{
      id: number;
      title: string;
      issuer?: string;
      date?: string;
      description?: string;
    }>(
      `SELECT * FROM awards WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );

    // Get skills
    const skillsResult = await client.queryObject<{
      id: number;
      category: string;
      skills: string[];
    }>(
      `SELECT * FROM skills WHERE user_id = $1`,
      [userId]
    );

    // Get contact info
    const contactResult = await client.queryObject<{
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
    }>(
      `SELECT * FROM contact_info WHERE user_id = $1`,
      [userId]
    );

    return {
      experience: experienceResult.rows.map(exp => ({
        id: exp.id,
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date,
        end_date: exp.end_date,
        location: exp.location,
        responsibilities: exp.responsibilities,
        achievements: exp.achievements,
        narrative: exp.narrative
      })),
      education: educationResult.rows.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        start_date: edu.start_date,
        end_date: edu.end_date,
        location: edu.location,
        achievements: edu.achievements
      })),
      awards: awardsResult.rows.map(award => ({
        id: award.id,
        title: award.title,
        issuer: award.issuer,
        date: award.date,
        description: award.description
      })),
      skills: skillsResult.rows.map(skill => ({
        id: skill.id,
        category: skill.category,
        skills: skill.skills
      })),
      contact: contactResult.rows[0] ? {
        fullName: contactResult.rows[0].full_name,
        email: contactResult.rows[0].email,
        phone: contactResult.rows[0].phone,
        location: contactResult.rows[0].location,
        linkedin: contactResult.rows[0].linkedin,
        phoneNumbers: contactResult.rows[0].phone_numbers
      } : null
    };
  });
}

export interface ExperienceUpdate {
  id: number;
  userId: number;
  field: string;
  value: string | null;
}

export async function updateExperienceField({ id, userId, field, value }: ExperienceUpdate) {
  console.log('DB: Updating experience field:', { id, userId, field, value });
  
  return await withTransaction(async (client: Client) => {
    // First verify this experience belongs to the user
    const result = await client.queryObject<{ user_id: number }>(
      `SELECT user_id FROM professional_experience WHERE id = $1`,
      [id]
    );

    if (!result.rows.length || result.rows[0].user_id !== userId) {
      throw new Error('Unauthorized: Experience does not belong to user');
    }

    // Update the specified field
    const query = `UPDATE professional_experience SET ${field} = $1 WHERE id = $2 AND user_id = $3 RETURNING *`;
    const updateResult = await client.queryObject(query, [value, id, userId]);
    
    if (!updateResult.rows.length) {
      throw new Error('Failed to update experience');
    }

    console.log('DB: Successfully updated experience:', updateResult.rows[0]);
    return updateResult.rows[0];
  });
} 