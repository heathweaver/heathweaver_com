import postgres from "postgres";
import { sql } from "../../lib/db/postgres-base.ts";
import {
  DatabaseService as IDatabase,
  DBAward,
  DBContact,
  DBEducation,
  DBExperience,
  DBPublication,
  DBSkill,
} from "../types/db.ts";
import { JobContent } from "../types/job.ts";

/**
 * DatabaseService handles all database interactions for the CV generation system.
 * Provides methods to fetch structured CV data from PostgreSQL including contact info,
 * professional experience, education, skills, awards, and publications.
 */
export class DatabaseService implements IDatabase {
  private static readonly QUERIES = {
    contact: `SELECT * FROM contact_info LIMIT 1`,
    experience: `
      SELECT DISTINCT ON (company, start_date) 
      id, company, title, start_date, end_date, location, 
      responsibilities, achievements, narrative
      FROM professional_experience 
      ORDER BY company, start_date DESC`,
    education: `
      SELECT DISTINCT ON (institution, start_date)
      id, institution, degree, field, start_date, end_date, location, achievements
      FROM education 
      ORDER BY institution, start_date DESC`,
    skills: `
      SELECT DISTINCT ON (category)
      id, category, skills
      FROM skills
      ORDER BY category`,
    awards: `SELECT * FROM awards ORDER BY date DESC NULLS LAST`,
    publications: `SELECT * FROM publications ORDER BY date DESC NULLS LAST`,
    storeJob: `
      INSERT INTO job_content (
        id, title, company, location, salary, description,
        requirements, responsibilities, about_company, benefits,
        raw_content, url, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
      )`,
  } as const;

  private sql: postgres.Sql;

  constructor() {
    this.sql = sql;
  }

  async connect() {
    // Connection is handled by the pool
  }

  async disconnect() {
    // Pool cleanup is handled globally
  }

  /**
   * Stores job content in the database with a unique ID
   */
  async storeJobContent(
    content: JobContent,
    rawContent: string,
    id: string,
    url: string,
  ): Promise<void> {
    await this.sql`
      INSERT INTO job_content (
        id, title, company, location, salary, description,
        requirements, responsibilities, about_company, benefits,
        raw_content, url, created_at
      ) VALUES (
        ${id}, ${content.title ?? null}, ${content.company ?? null}, ${content.location ?? null},
        ${content.salary ?? null}, ${content.description ?? null},
        ${content.requirements ?? null}, ${content.responsibilities ?? null},
        ${content.aboutCompany ?? null}, ${content.benefits ?? null},
        ${rawContent}, ${url}, NOW()
      )
    `;
  }

  /**
   * Retrieves all CV-related data from the database in a structured format.
   * Uses DISTINCT ON to prevent duplicate entries and ensures proper ordering.
   */
  async fetchCVData() {
    const [contact, experience, education, skills, awards, publications] =
      await Promise.all([
        this.sql<DBContact[]>`SELECT * FROM contact_info LIMIT 1`,
        this.sql<DBExperience[]>`
          SELECT DISTINCT ON (company, start_date) 
          id, company, title, start_date, end_date, location, 
          responsibilities, achievements, narrative
          FROM professional_experience 
          ORDER BY company, start_date DESC
        `,
        this.sql<DBEducation[]>`
          SELECT DISTINCT ON (institution, start_date)
          id, institution, degree, field, start_date, end_date, location, achievements
          FROM education 
          ORDER BY institution, start_date DESC
        `,
        this.sql<DBSkill[]>`
          SELECT DISTINCT ON (category)
          id, category, skills
          FROM skills
          ORDER BY category
        `,
        this.sql<DBAward[]>`SELECT * FROM awards ORDER BY date DESC NULLS LAST`,
        this.sql<DBPublication[]>`SELECT * FROM publications ORDER BY date DESC NULLS LAST`,
      ]);

    return {
      contact: contact[0],
      experience: experience,
      education: education,
      skills: skills,
      awards: awards,
      publications: publications,
    };
  }
}
