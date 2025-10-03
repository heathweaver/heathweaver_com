import {
  AwardItem,
  BasicInfo,
  BulletPoint,
  CV,
  EducationItem,
  EmploymentHistoryItem,
  PublicationItem,
  SkillItem,
} from "../../types/cv.ts";
import { AIService } from "../../types/ai-service.types.ts";
import { DatabaseService } from "../../db/database.ts";
import {
  DBAward,
  DBContact,
  DBEducation,
  DBExperience,
  DBPublication,
  DBSkill,
} from "../../types/db.ts";
import { GenerateOptions } from "../../types/cv-generation.ts";
import {
  CV_GENERATOR_PROFILE_PROMPT,
  CV_JOB_BULLETS,
} from "../../prompt/index.ts";
import { DEFAULT_BULLET_CONFIG } from "../../types/cv-generation.ts";

interface ParsedJobPosting {
  title: string;
  company: string;
  responsibilities: string[];
  requirements: string[];
  description: string;
}

/**
 * Service for generating customized CVs using AI based on job requirements
 */
export class CVGenerator {
  constructor(
    private ai: AIService,
    private db: DatabaseService,
  ) {}

  /**
   * Parses raw job posting content into structured format
   */
  private parseJobPosting(content: string): ParsedJobPosting {
    // Initialize with defaults
    const parsed: ParsedJobPosting = {
      title: "",
      company: "",
      responsibilities: [],
      requirements: [],
      description: "",
    };

    // Extract title and company if present in structured format
    const titleMatch = content.match(/title:\s*"([^"]+)"/i);
    const companyMatch = content.match(/company:\s*"([^"]+)"/i);
    parsed.title = titleMatch?.[1] || "";
    parsed.company = companyMatch?.[1] || "";

    // Split content into sections
    const sections = content.split(/\n\s*\n/);

    let currentSection = "description";
    for (const section of sections) {
      const cleanSection = section.trim();

      // Skip empty sections
      if (!cleanSection) continue;

      // Detect section type
      if (
        /responsibilities|position responsibilities|job duties/i.test(
          cleanSection,
        )
      ) {
        currentSection = "responsibilities";
        continue;
      }
      if (
        /requirements|qualifications|skills|experience required/i.test(
          cleanSection,
        )
      ) {
        currentSection = "requirements";
        continue;
      }

      // Extract bullet points
      const bullets = cleanSection.split(/[•\-\*]\s+/)
        .map((b) => b.trim())
        .filter((b) => b.length > 10); // Filter out short/empty bullets

      // Add content to appropriate section
      switch (currentSection) {
        case "responsibilities":
          parsed.responsibilities.push(...bullets);
          break;
        case "requirements":
          parsed.requirements.push(...bullets);
          break;
        default:
          if (cleanSection.length > 50) { // Only add substantial paragraphs
            parsed.description += cleanSection + "\n\n";
          }
      }
    }

    // Clean up and deduplicate
    parsed.responsibilities = [...new Set(parsed.responsibilities)];
    parsed.requirements = [...new Set(parsed.requirements)];
    parsed.description = parsed.description.trim();

    return parsed;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  async generateCV(options: GenerateOptions): Promise<CV> {
    const rawData = await this.db.fetchCVData();

    // Parse job posting if provided
    let jobData: ParsedJobPosting | null = null;
    if (typeof options.requirements === "string") {
      jobData = this.parseJobPosting(options.requirements);
      options.requirements = [
        ...jobData.requirements,
        ...jobData.responsibilities,
      ].join("\n");
      options.jobTitle = jobData.title || options.jobTitle;
    }

    // Transform contact info into BasicInfo
    const contact = rawData.contact as DBContact;
    const basicInfo: BasicInfo = {
      name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      location: contact.location,
      linkedin: contact.linkedin,
    };

    // Transform experience into employment history with customized bullet points
    const employmentHistory: EmploymentHistoryItem[] = [];
    for (const job of (rawData.experience as DBExperience[])) {
      const customBullets = await this.generateCustomBulletPoints(
        job,
        options,
        jobData?.requirements || [],
      );

      employmentHistory.push({
        company: job.company,
        title: job.title,
        start_date: this.formatDate(job.start_date.toISOString()),
        end_date: job.end_date
          ? this.formatDate(job.end_date.toISOString())
          : undefined,
        location: job.location,
        responsibilities: job.responsibilities,
        achievements: job.achievements,
        narrative: job.narrative,
        bulletPoints: customBullets,
      });
    }

    // Sort in reverse chronological order
    employmentHistory.sort((a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    // Always set the most recent job's end date to 'Present'
    if (employmentHistory.length > 0) {
      employmentHistory[0].end_date = "Present";
    }

    // Transform education
    const education: EducationItem[] = (rawData.education as DBEducation[]).map(
      (edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        location: edu.location,
        start_date: edu.start_date.toISOString().split("T")[0],
        end_date: edu.end_date.toISOString().split("T")[0],
      }),
    );

    // Transform skills - separate languages and append at end
    const allSkills = rawData.skills as DBSkill[];
    const languageSkills = allSkills.find((skill) =>
      skill.category === "Languages"
    );
    const otherSkills = allSkills.filter((skill) =>
      skill.category !== "Languages"
    );

    const skills: SkillItem[] = [
      ...otherSkills.map((skill) => ({
        category: skill.category,
        skills: skill.skills,
      })),
      ...(languageSkills
        ? [{
          category: languageSkills.category,
          skills: languageSkills.skills,
        }]
        : []),
    ];

    // Transform awards
    const awards: AwardItem[] = (rawData.awards as DBAward[]).map((award) => ({
      title: award.title,
      issuer: award.issuer || undefined,
      date: award.date ? award.date.toISOString().split("T")[0] : undefined,
    }));

    // Transform publications
    const publications: PublicationItem[] =
      (rawData.publications as DBPublication[]).map((pub) => ({
        title: pub.title,
        publisher: pub.publisher,
        date: pub.date ? pub.date.toISOString().split("T")[0] : undefined,
        url: pub.url,
        description: pub.description,
      }));

    // Generate profile using AI
    // const profile = await this.generateProfile(options, basicInfo, employmentHistory);
    const profile = ""; // Removing summary section

    return {
      basicInfo,
      profile,
      employmentHistory,
      certificatesAndAwards: awards.map((award) => award.title),
      contact: rawData.contact,
      experience: rawData.experience,
      education,
      skills,
      awards,
      publications,
    };
  }

  private async generateCustomBulletPoints(
    job: DBExperience,
    options: GenerateOptions,
    jobRequirements: string[] = [],
  ): Promise<BulletPoint[]> {
    console.log(`Generating bullets for: ${job.company} - ${job.title}`);
    const config = options.bulletPointConfig || DEFAULT_BULLET_CONFIG;

    if (!config[job.company]) {
      throw new Error(
        `Company "${job.company}" not found in bullet point configuration`,
      );
    }

    const bulletCount = config[job.company];
    const wordCount = 50;

    const prompt = this.constructBulletPrompt(
      job,
      jobRequirements.length > 0 ? jobRequirements : options.requirements,
      bulletCount,
      wordCount,
    );

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
      throw new Error(
        `Failed to parse bullet response: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private calculateJobDuration(startDate: Date, endDate: Date | null): number {
    const end = endDate || new Date();
    const diffInMs = end.getTime() - startDate.getTime();
    const years = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    return years;
  }

  private getBulletConfig(
    years: number,
  ): { bulletCount: number; wordCount: number } {
    if (years < 2) return { bulletCount: 1, wordCount: 30 };
    if (years <= 3) return { bulletCount: 2, wordCount: 50 };
    return { bulletCount: 4, wordCount: 80 };
  }

  private constructBulletPrompt(
    job: DBExperience,
    targetRequirements: string | string[],
    bulletCount: number,
    wordCount: number,
  ): string {
    const requirements = Array.isArray(targetRequirements)
      ? targetRequirements.join("\n")
      : targetRequirements;

    console.log(`Bullet config for ${job.company}:`, {
      bulletCount,
      wordCount,
    });

    const systemInstructions = CV_JOB_BULLETS.system_instructions
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
Duration: ${job.start_date.toISOString().split("T")[0]} to ${
      job.end_date ? job.end_date.toISOString().split("T")[0] : "Present"
    }
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

  private async generateProfile(
    options: GenerateOptions,
    basicInfo: BasicInfo,
    employmentHistory: EmploymentHistoryItem[],
  ): Promise<string> {
    const careerHistory = employmentHistory
      .map((job) =>
        `${job.title} at ${job.company} (${job.start_date} - ${job.end_date})
Key Achievements:
${job.achievements?.map((a) => `- ${a}`).join("\n")}`
      )
      .join("\n\n");

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
