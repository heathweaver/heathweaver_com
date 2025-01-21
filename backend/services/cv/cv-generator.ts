import { CV, BasicInfo, BulletPoint, EmploymentHistoryItem, EducationItem, SkillItem, AwardItem, PublicationItem } from "../../types/cv.ts";
import { AIService } from "../../types/ai-service.types.ts";
import { DatabaseService } from "../../db/database.ts";
import { DBExperience, DBEducation, DBSkill, DBAward, DBContact, DBPublication } from "../../types/db.ts";
import { GenerateOptions } from "../../types/cv-generation.ts";
import { CV_GENERATOR_HEADLINE_PROMPT, CV_GENERATOR_PROFILE_PROMPT } from "../../prompt/index.ts";

/**
 * Service for generating customized CVs using AI based on job requirements
 */
export class CVGenerator {
  constructor(
    private ai: AIService,
    private db: DatabaseService
  ) {}

  async generateCV(options: GenerateOptions): Promise<CV> {
    const rawData = await this.db.fetchCVData();
    
    // Transform contact info into BasicInfo
    const contact = rawData.contact as DBContact;
    const basicInfo: BasicInfo = {
      name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      location: contact.location,
      linkedin: contact.linkedin
    };

    // Transform experience into employment history
    const employmentHistory: EmploymentHistoryItem[] = (rawData.experience as DBExperience[])
      .sort((a, b) => b.start_date.getTime() - a.start_date.getTime())  // Sort in reverse chronological order
      .map(job => ({
        company: job.company,
        title: job.title,
        start_date: job.start_date.toISOString().split('T')[0],
        end_date: job.end_date ? job.end_date.toISOString().split('T')[0] : undefined,
        location: job.location,
        responsibilities: job.responsibilities,
        achievements: job.achievements,
        narrative: job.narrative,
        bulletPoints: this.transformBulletPoints(job.achievements)
      }));

    // Transform education
    const education: EducationItem[] = (rawData.education as DBEducation[]).map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      start_date: edu.start_date.toISOString().split('T')[0],
      end_date: edu.end_date.toISOString().split('T')[0],
    }));

    // Transform skills - separate languages and append at end
    const allSkills = rawData.skills as DBSkill[];
    const languageSkills = allSkills.find(skill => skill.category === "Languages");
    const otherSkills = allSkills.filter(skill => skill.category !== "Languages");
    
    const skills: SkillItem[] = [
      ...otherSkills.map(skill => ({
        category: skill.category,
        skills: skill.skills
      })),
      ...(languageSkills ? [{
        category: languageSkills.category,
        skills: languageSkills.skills
      }] : [])
    ];

    // Transform awards
    const awards: AwardItem[] = (rawData.awards as DBAward[]).map(award => ({
      title: award.title,
      issuer: award.issuer || undefined,
      date: award.date ? award.date.toISOString().split('T')[0] : undefined
    }));

    // Transform publications
    const publications: PublicationItem[] = (rawData.publications as DBPublication[]).map(pub => ({
      title: pub.title,
      publisher: pub.publisher,
      date: pub.date ? pub.date.toISOString().split('T')[0] : undefined,
      url: pub.url,
      description: pub.description
    }));

    // Generate headline and profile using AI
    const headline = await this.generateHeadline(options, basicInfo, employmentHistory);
    const profile = await this.generateProfile(options, basicInfo, employmentHistory);

    return {
      basicInfo,
      headline,
      profile,
      employmentHistory,
      certificatesAndAwards: awards.map(award => award.title),
      contact: rawData.contact,
      experience: rawData.experience,
      education,
      skills,
      awards,
      publications
    };
  }

  private transformBulletPoints(achievements: string[]): BulletPoint[] {
    return achievements.map(achievement => ({
      content: achievement
    }));
  }

  private async generateHeadline(
    options: GenerateOptions, 
    basicInfo: BasicInfo,
    employmentHistory: EmploymentHistoryItem[]
  ): Promise<string> {
    const careerHistory = employmentHistory
      .map(job => `${job.title} at ${job.company} (${job.start_date} - ${job.end_date || 'Present'})`)
      .join('\n');

    const prompt = CV_GENERATOR_HEADLINE_PROMPT
      .replace("{jobTitle}", options.jobTitle)
      .replace("{requirements}", options.requirements)
      .replace("{responsibilities}", options.responsibilities)
      .replace("{careerHistory}", careerHistory);

    const response = await this.ai.processJobPosting(prompt);
    if (response.error || !response.content.length) {
      console.error("Failed to generate headline:", response.error);
      return `${options.jobTitle.toUpperCase()} WITH PROVEN TRACK RECORD`;
    }

    return response.content[0].trim().toUpperCase();
  }

  private async generateProfile(
    options: GenerateOptions,
    basicInfo: BasicInfo,
    employmentHistory: EmploymentHistoryItem[]
  ): Promise<string> {
    const careerHistory = employmentHistory
      .map(job => `${job.title} at ${job.company} (${job.start_date} - ${job.end_date || 'Present'})
Key Achievements:
${job.achievements?.map(a => `- ${a}`).join('\n') || 'No achievements listed'}`)
      .join('\n\n');

    const prompt = CV_GENERATOR_PROFILE_PROMPT
      .replace("{jobTitle}", options.jobTitle)
      .replace("{requirements}", options.requirements)
      .replace("{responsibilities}", options.responsibilities)
      .replace("{careerHistory}", careerHistory);

    const response = await this.ai.processJobPosting(prompt);
    if (response.error || !response.content.length) {
      console.error("Failed to generate profile:", response.error);
      return `Experienced ${options.jobTitle} with a proven track record...`;
    }

    return response.content[0].trim();
  }
} 