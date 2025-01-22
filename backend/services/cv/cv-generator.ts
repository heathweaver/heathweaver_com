import { CV, BasicInfo, BulletPoint, EmploymentHistoryItem, EducationItem, SkillItem, AwardItem, PublicationItem } from "../../types/cv.ts";
import { AIService } from "../../types/ai-service.types.ts";
import { DatabaseService } from "../../db/database.ts";
import { DBExperience, DBEducation, DBSkill, DBAward, DBContact, DBPublication } from "../../types/db.ts";
import { GenerateOptions } from "../../types/cv-generation.ts";
import { CV_GENERATOR_HEADLINE_PROMPT, CV_GENERATOR_PROFILE_PROMPT, CV_JOB_BULLETS } from "../../prompt/index.ts";

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

    // Transform experience into employment history with customized bullet points
    const employmentHistory: EmploymentHistoryItem[] = [];
    for (const job of (rawData.experience as DBExperience[])) {
      const customBullets = await this.generateCustomBulletPoints(job, options);
      employmentHistory.push({
        company: job.company,
        title: job.title,
        start_date: job.start_date.toISOString().split('T')[0],
        end_date: job.end_date ? job.end_date.toISOString().split('T')[0] : undefined,
        location: job.location,
        responsibilities: job.responsibilities,
        achievements: job.achievements,
        narrative: job.narrative,
        bulletPoints: customBullets
      });
    }
    // Sort in reverse chronological order
    employmentHistory.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

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

  private async generateCustomBulletPoints(job: DBExperience, options: GenerateOptions): Promise<BulletPoint[]> {
    console.log(`Generating bullets for: ${job.company} - ${job.title}`);
    const prompt = this.constructBulletPrompt(job, options.requirements);
    console.log("\nBullet point prompt after replacement:", prompt);
    const response = await this.ai.processJobPosting(prompt);
    
    if (response.error) {
      throw new Error(`generateCustomBulletPoints: ${response.error}`);
    }

    console.log("Raw bullet response:", response.content[0]);
    try {
      const result = JSON.parse(response.content[0]);
      return result.jobs[0].bullets.map((content: string) => ({ content }));
    } catch (error: unknown) {
      console.error("Failed to parse bullet response:", error);
      throw new Error(`Failed to parse bullet response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateJobDuration(startDate: Date, endDate: Date | null): number {
    const end = endDate || new Date();
    const diffInMs = end.getTime() - startDate.getTime();
    const years = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    return years;
  }

  private getBulletConfig(years: number): { bulletCount: number, wordCount: number } {
    if (years < 2) return { bulletCount: 1, wordCount: 30 };
    if (years <= 3) return { bulletCount: 2, wordCount: 50 };
    return { bulletCount: 4, wordCount: 80 };
  }

  private constructBulletPrompt(job: DBExperience, targetRequirements: string | string[]): string {
    const requirements = Array.isArray(targetRequirements) 
      ? targetRequirements.join("\n")
      : targetRequirements;

    const years = this.calculateJobDuration(job.start_date, job.end_date);
    const { bulletCount, wordCount } = this.getBulletConfig(years);
    
    console.log(`Job duration config for ${job.company}:`, {
      years: years.toFixed(1),
      bulletCount,
      wordCount
    });

    const systemInstructions = CV_JOB_BULLETS.system_instructions
      .replace('<CURRENT_CURSOR_POSITION>', '')
      .replace(/{bulletCount}/g, bulletCount.toString())
      .replace(/{wordCount}/g, wordCount.toString());

    const rules = CV_JOB_BULLETS.rules
      .replace(/{bulletCount}/g, bulletCount.toString())
      .replace(/{wordCount}/g, wordCount.toString());

    const responseFormat = CV_JOB_BULLETS.response_format
      .replace(/{bulletCount}/g, bulletCount.toString());

    return `${systemInstructions}

Target Role Requirements:
${requirements}

Job Information:
Company: ${job.company}
Title: ${job.title}
Duration: ${job.start_date.toISOString().split('T')[0]} to ${job.end_date ? job.end_date.toISOString().split('T')[0] : 'Present'}
Years in Role: ${years.toFixed(1)} years
Required Bullet Points: ${bulletCount}
Max Words per Bullet: ${wordCount}

Responsibilities:
${job.responsibilities.join("\n")}
Achievements:
${job.achievements.join("\n")}
Narrative:
${Array.isArray(job.narrative) ? job.narrative.join("\n") : job.narrative}

${rules}

${responseFormat}`;
  }

  private async generateHeadline(
    options: GenerateOptions, 
    basicInfo: BasicInfo,
    employmentHistory: EmploymentHistoryItem[]
  ): Promise<string> {
    const careerHistory = employmentHistory
      .map(job => `${job.title} at ${job.company} (${job.start_date} - ${job.end_date})`)
      .join('\n');

    const prompt = CV_GENERATOR_HEADLINE_PROMPT
      .replace("{jobTitle}", options.jobTitle)
      .replace("{requirements}", options.requirements)
      .replace("{responsibilities}", options.responsibilities)
      .replace("{careerHistory}", careerHistory);

    console.log("\nHeadline prompt after replacement:", prompt);
    const response = await this.ai.processJobPosting(prompt);
    if (response.error) {
      throw new Error(`generateHeadline: ${response.error}`);
    }

    return response.content[0].trim().toUpperCase();
  }

  private async generateProfile(
    options: GenerateOptions,
    basicInfo: BasicInfo,
    employmentHistory: EmploymentHistoryItem[]
  ): Promise<string> {
    const careerHistory = employmentHistory
      .map(job => `${job.title} at ${job.company} (${job.start_date} - ${job.end_date})
Key Achievements:
${job.achievements?.map(a => `- ${a}`).join('\n')}`)
      .join('\n\n');

    const prompt = CV_GENERATOR_PROFILE_PROMPT
      .replace("{jobTitle}", options.jobTitle)
      .replace("{requirements}", options.requirements)
      .replace("{responsibilities}", options.responsibilities)
      .replace("{careerHistory}", careerHistory);

    console.log("\nProfile prompt after replacement:", prompt);
    const response = await this.ai.processJobPosting(prompt);
    if (response.error) {
      throw new Error(`generateProfile: ${response.error}`);
    }

    console.log("Raw profile response:", response.content[0]);
    try {
      const result = JSON.parse(response.content[0]);
      return result.profile || result.content || response.content[0].trim();
    } catch (error) {
      console.error("Failed to parse profile response:", error);
      return response.content[0].trim();
    }
  }
} 