import { CV, BasicInfo, EmploymentHistoryItem, EducationItem, SkillItem, AwardItem, PublicationItem } from "../../types/cv.ts";
import { AIService } from "../../types/ai-service.types.ts";
import { DatabaseService } from "../../db/database.ts";

interface GenerateOptions {
  jobId?: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string;
  responsibilities: string;
}

/**
 * Service for generating customized CVs using AI based on job requirements
 */
export class CVGenerator {
  constructor(
    private ai: AIService,
    private db: DatabaseService
  ) {}

  async generateCV(options: GenerateOptions): Promise<CV> {
    const cvData = await this.db.fetchCVData();
    const basicInfo = await this.db.fetchBasicInfo() as BasicInfo;
    const headline = await this.db.fetchHeadline() as string;
    const profile = await this.db.fetchProfile() as string;
    const employmentHistory = await this.db.fetchEmploymentHistory() as EmploymentHistoryItem[];
    const certificatesAndAwards = await this.db.fetchCertificatesAndAwards() as string[];
    const education = await this.db.fetchEducation() as EducationItem[];
    const skills = await this.db.fetchSkills() as SkillItem[];
    const awards = await this.db.fetchAwards() as AwardItem[];
    const publications = await this.db.fetchPublications() as PublicationItem[];

    // Use jobId if available to link with stored job content
    // AI processing logic here
    
    // Construct a complete CV object
    const cv: CV = {
      basicInfo: basicInfo,
      headline: headline,
      profile: profile,
      employmentHistory: employmentHistory,
      certificatesAndAwards: certificatesAndAwards,
      contact: cvData.contact,
      experience: cvData.experience,
      education: education,
      skills: skills,
      awards: awards,
      publications: publications,
    };
    return cv;
  }
} 