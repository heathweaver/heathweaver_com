import { JobContent } from "./job.ts";

export interface DatabaseConfig {
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
}

export interface DBExperience {
  id: number;
  company: string;
  title: string;
  start_date: Date;
  end_date: Date | null;
  location: string;
  responsibilities: string[];
  achievements: string[];
  narrative: string[];
}

export interface DBEducation {
  id: number;
  institution: string;
  degree: string;
  field: string;
  start_date: Date;
  end_date: Date;
}

export interface DBSkill {
  id: number;
  category: string;
  skills: string[];
}

export interface DBAward {
  id: number;
  title: string;
  issuer: string | null;
  date: Date | null;
}

export interface DBJobContent extends JobContent {
  id: string;
  created_at: Date;
  raw_content: string;
}

export interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchCVData(): Promise<{
    contact: unknown;
    experience: unknown[];
    education: unknown[];
    skills: unknown[];
    awards: unknown[];
    publications: unknown[];
  }>;
  storeJobContent?(content: JobContent, rawContent: string, id: string): Promise<void>;
} 