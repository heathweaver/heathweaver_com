import { Client } from "postgres";
import { DatabaseService as IDatabase, DBContact, DBExperience, DBEducation, DBSkill, DBAward, DBPublication } from "../types/db.ts";
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
      )`
  } as const;

  private client: Client;

  constructor() {
    this.client = new Client({
      hostname: Deno.env.get("POSTGRES_HOST"),
      port: Number(Deno.env.get("POSTGRES_PORT")),
      database: Deno.env.get("POSTGRES_DB"),
      user: Deno.env.get("POSTGRES_USER"),
      password: Deno.env.get("POSTGRES_PASSWORD"),
      tls: { enabled: false }
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  /**
   * Stores job content in the database with a unique ID
   */
  async storeJobContent(content: JobContent, rawContent: string, id: string, url: string): Promise<void> {
    await this.client.queryObject(DatabaseService.QUERIES.storeJob, [
      id,
      content.title,
      content.company,
      content.location,
      content.salary,
      content.description,
      content.requirements,
      content.responsibilities,
      content.aboutCompany,
      content.benefits,
      rawContent,
      url
    ]);
  }

  /**
   * Retrieves all CV-related data from the database in a structured format.
   * Uses DISTINCT ON to prevent duplicate entries and ensures proper ordering.
   */
  async fetchCVData() {
    const [contact, experience, education, skills, awards, publications] = await Promise.all([
      this.client.queryObject<DBContact>(DatabaseService.QUERIES.contact),
      this.client.queryObject<DBExperience>(DatabaseService.QUERIES.experience),
      this.client.queryObject<DBEducation>(DatabaseService.QUERIES.education),
      this.client.queryObject<DBSkill>(DatabaseService.QUERIES.skills),
      this.client.queryObject<DBAward>(DatabaseService.QUERIES.awards),
      this.client.queryObject<DBPublication>(DatabaseService.QUERIES.publications),
    ]);

    return {
      contact: contact.rows[0],
      experience: experience.rows,
      education: education.rows,
      skills: skills.rows,
      awards: awards.rows,
      publications: publications.rows,
    };
  }
} 