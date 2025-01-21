import { parse } from "@std/yaml";
import { JobHistory } from "../../types/cv.ts";
import { PromptTemplate, PromptData } from "../../types/prompt.ts";

export class PromptService {
  private promptData: PromptData | null = null;

  async loadPrompts(promptPath: string = "backend/prompts/cv-generation.yml"): Promise<void> {
    const yamlContent = await Deno.readTextFile(promptPath);
    this.promptData = parse(yamlContent) as PromptData;
  }

  formatHeadlinePrompt(data: {
    job_title: string;
    requirements: string;
    responsibilities: string;
    career_history: JobHistory[];
  }): string {
    if (!this.promptData?.cv_generation.headline_prompt) {
      throw new Error("Prompts not loaded or headline prompt missing");
    }

    return this.promptData.cv_generation.headline_prompt
      .replace("{job_title}", data.job_title)
      .replace("{requirements}", data.requirements)
      .replace("{responsibilities}", data.responsibilities)
      .replace("{career_history}", this.formatJobHistory(data.career_history));
  }

  formatProfilePrompt(data: {
    job_title: string;
    requirements: string;
    responsibilities: string;
    career_history: JobHistory[];
  }): string {
    if (!this.promptData?.cv_generation.profile_prompt) {
      throw new Error("Prompts not loaded or profile prompt missing");
    }

    return this.promptData.cv_generation.profile_prompt
      .replace("{job_title}", data.job_title)
      .replace("{requirements}", data.requirements)
      .replace("{responsibilities}", data.responsibilities)
      .replace("{career_history}", this.formatJobHistory(data.career_history));
  }

  formatJobBulletPrompt(data: {
    job_title: string;
    requirements: string;
    responsibilities: string;
    job_history: JobHistory[];
  }): string {
    if (!this.promptData?.cv_generation.job_bullets) {
      throw new Error("Prompts not loaded or job bullets template missing");
    }

    const template = this.promptData.cv_generation.job_bullets;
    let prompt = template.template;
    
    // Replace template variables
    prompt = prompt
      .replace("{system_instructions}", template.system_instructions || "")
      .replace("{format_instructions}", template.format_instructions || "")
      .replace("{job_title}", data.job_title)
      .replace("{requirements}", data.requirements)
      .replace("{responsibilities}", data.responsibilities)
      .replace("{job_history}", this.formatJobHistory(data.job_history));

    return prompt;
  }

  private formatJobHistory(jobs: JobHistory[]): string {
    return jobs.map(job => `
Company: ${job.company}
Title: ${job.title}
Duration: ${this.calculateDuration(job.start_date, job.end_date)}
Location: ${job.location || 'Remote'}
Responsibilities:
${job.responsibilities.map(r => `- ${r}`).join('\n')}
Achievements:
${job.achievements.map(a => `- ${a}`).join('\n')}
Narrative:
${job.narrative.map(n => `- ${n}`).join('\n')}
`).join('\n---\n');
  }

  private calculateDuration(startDate: Date, endDate: Date | null): string {
    const end = endDate || new Date();
    const diffYears = (end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears.toFixed(1) + " years";
  }
} 