export interface PromptTemplate {
  system_instructions?: string;
  format_instructions?: string;
  template: string;
}

export interface PromptData {
  cv_generation: {
    headline_prompt: string;
    profile_prompt: string;
    job_bullets: PromptTemplate;
  };
} 