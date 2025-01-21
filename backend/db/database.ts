import { Client } from "postgres";
import { config } from "../../config.ts";
import { DatabaseService as IDatabase } from "../types/db.ts";

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
    publications: `SELECT * FROM publications ORDER BY date DESC NULLS LAST`
  } as const;

  private client: Client;

  constructor() {
    this.client = new Client({
      hostname: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
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
   * Retrieves all CV-related data from the database in a structured format.
   * Uses DISTINCT ON to prevent duplicate entries and ensures proper ordering.
   */
  async fetchCVData() {
    const [contact, experience, education, skills, awards, publications] = await Promise.all([
      this.client.queryObject(DatabaseService.QUERIES.contact),
      this.client.queryObject(DatabaseService.QUERIES.experience),
      this.client.queryObject(DatabaseService.QUERIES.education),
      this.client.queryObject(DatabaseService.QUERIES.skills),
      this.client.queryObject(DatabaseService.QUERIES.awards),
      this.client.queryObject(DatabaseService.QUERIES.publications),
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