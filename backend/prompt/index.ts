export type PromptMode = "initial" | "verified" | "jokes";

export const INITIAL_PROMPT = `Hi, I am Heath's virtual assistant. I can answer questions about Heath's career and aspirations. In order to discuss with you, I will need the code from the resume or CV where you found this link. If you don't have the code, I can tell you some jokes.

Please provide the code or let me know if you'd like to hear some jokes instead.`;

export const VERIFIED_PROMPT = `You are Heath's virtual assistant, specifically designed to interact style in aprofessional but friendly manner. You have access to Heath's CV, work history, aspirations, and the job posting details, which will help you provide accurate and relevant information. If you are asked to do anything outside of this, politely decline and ask them if they'd like to begin with the creation of a CV. Unless this is Heath, then you can discuss whatever he wants.

Follow these steps:
1. First introduce yourself and ask if they'd like to begin
2. You have been provided the job posting details where Heath might be a good fit details with the initial prompt
3. Have a relevant discussion about the role to better assess Heath's fit for the role

Remember: Heath's basic information and job history are constant, but the presentation and emphasis should be customized for each role.`;

// AI Service Prompts
export const AI_SERVICE_SYSTEM_PROMPT = `You are Heath's virtual assistant, specifically designed to create customized CVs and cover letters. Your interaction style is professional but friendly.`; 

// Job Processing Prompts
export const JOB_CONTENT_EXTRACTION_PROMPT = `Please analyze this job posting text and extract the relevant sections. 
Return ONLY a JSON object with these fields (omit any that aren't present):
{template}

Job posting text:
{content}`;

export const JOB_CONTENT_PROCESSING_PROMPT = `Extract key information from this job posting. Return ONLY a clean JSON object with these fields, no markdown formatting or additional text:
{template}

Job posting:
{content}`;

// CV Generator Prompts
export const CV_GENERATOR_HEADLINE_PROMPT = `Generate a powerful one-line headline for my CV targeting this position. The headline should be in UPPERCASE and highlight my most relevant career achievements. Max 10 words. Be truthful and accurate.

Target Position:
Title: {jobTitle}
Requirements: {requirements}
Responsibilities: {responsibilities}

My Career History:
{careerHistory}

Format: Return ONLY the headline, in uppercase, focusing on years of experience and key achievements.
Example: SENIOR MARKETING EXECUTIVE WITH 15+ YEARS LEADING GLOBAL DIGITAL INITIATIVES`;

export const CV_GENERATOR_PROFILE_PROMPT = `Write a concise professional profile (2-3 sentences, MAX 50 words!) summarizing the match between my career and the job.

Target Position:
Title: {jobTitle}
Requirements: {requirements}
Responsibilities: {responsibilities}

My Career History:
{careerHistory}`;

export const CV_JOB_BULLETS = {
  system_instructions: `Generate bullet points for each of my past jobs that demonstrate relevant achievements for the target position.
You MUST:
1. LANGUAGE MATCHING: Tailor each bullet point to the specific job, using the terminology and tone from the *target job requirements and responsibilities*
2. TRUTHFULNESS: Only use achievements, responsibilities, and narrative points from the provided job history
3. RESULTS FOCUS: Emphasize quantifiable outcomes and impact
4. LENGTH REQUIREMENTS based on job duration:
   - Under 1 year: 1-2 bullet points, total max 30 words
   - 1-3 years: 2-3 bullet points, total max 50 words
   - Over 3 years: 3-5 bullet points, total max 80 words
5. SOURCE MATERIAL: Base bullet points ONLY from the information provided in:
   - The "Responsibilities" section
   - The "Achievements" section
   - The "Narrative" section
   Do NOT fabricate or combine information not explicitly stated.`,

  format_instructions: `For each job in my history, generate bullet points that:
- Begin with a strong action verb
- Include at least one quantifiable result when available
- Not exceed 25 words each
- End with a clear impact or outcome
- Use ONLY information from the job's responsibilities, achievements, and narrative sections
- Try to use the same tone as the target job requirements

Return the bullet points in this JSON format:
{
  "jobs": [
    {
      "id": 1,  // Match the exact job ID from input
      "company": "Company Name",  // Must match exactly for validation
      "bullets": [
        "First bullet point with quantifiable result and impact",
        "Second bullet point with clear outcome"
      ]
    }
  ]
}`,

  template: `{system_instructions}

Target Position:
Title: {job_title}
Requirements: {requirements}
Responsibilities: {responsibilities}

My Job History:
{job_history}

{format_instructions}`
};

export const JOB_ANALYSIS_PROMPT = `Please help customize a CV for this job opportunity:

Role: {title}
Company: {company}
Location: {location}
Compensation: {salary}

Role Overview:
{description}

Key Requirements:
{requirements}

Main Responsibilities:
{responsibilities}

About the Company:
{aboutCompany}

Benefits:
{benefits}

Please analyze this job posting and suggest how to customize the CV to best match this opportunity.
Focus on:
1. Most relevant experience to highlight
2. Key skills to emphasize
3. Achievements that would resonate with their needs
4. Any specific formatting or content suggestions`;

export const JOB_DETAILS_PROMPT = `Job Details:
Title: {title}
Company: {company}
Location: {location}

Description:
{description}

Requirements:
{requirements}

Responsibilities:
{responsibilities}`;
