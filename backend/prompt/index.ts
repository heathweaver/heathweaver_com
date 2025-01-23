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
export const JOB_CONTENT_EXTRACTION_PROMPT = `Please analyze this job posting text and extract the relevant sections. If the title and company are not clearly stated in a title, infer it from the text.

Return ONLY a JSON object with these fields (omit any that aren't present):
{template}

Job posting text:
{content}`;

export const JOB_CONTENT_PROCESSING_PROMPT = `Extract key information from this job posting. Return ONLY a clean JSON object with these fields, no markdown formatting or additional text:
{template}

Job posting:
{content}`;

// CV Generator Prompts
export const CV_GENERATOR_HEADLINE_PROMPT = `Generate a powerful one-line headline for my CV targeting this position. The headline should highlight my most relevant career achievements. Max 10 words. Be truthful and accurate. The headline should be based on my career history and how in one sentence map how I am a good fit for the target role.

Format: Return ONLY the headline focusing on key achievements.
Example: SENIOR MARKETING EXECUTIVE WITH 15+ YEARS LEADING GLOBAL DIGITAL INITIATIVES`;

export const CV_GENERATOR_PROFILE_PROMPT = `Write a concise professional profile (2-3 sentences, MAX 50 words!) mapping the target role's requirements and my career. The profile should be based on my career history and map that I am a good fit for the target role. It's important that it does not seem written by an AI. Use language that is as naturally human as possible.

Only provide the profile, no other text, as JSON. Do not mention the words "target role" or other AI giveaways of generated text`;

export const CV_JOB_BULLETS = {
  system_instructions: `Map my job history to the target role's requirements using their exact phrases. Start with a strong verb, include a metric, and tie to their requirements. Never invent details.

  Create {bulletCount} bullet points not longer than {wordCount} words. Respond with json.

  Example:
  Target Role Reqs Input:
  - Experience building and optimizing operational systems and processes
  - Ability to prioritize and organize multiple projects

  Output:
  Optimized operational systems through detailed process documentation, reducing defects by 76% while managing over 30 clients.`,

  rules: `
  Use ONLY my Responsibilities, Achievements, Narrative
  Match their phrases verbatim where possible
  Create only {bulletCount} bullet points
  Max {wordCount} words per bullet, end with outcome`,

  response_format: `Return {bulletCount} bullet point(s) in this JSON format:
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
  }`
};
export const CV_JOB_BULLETS_OLD = {
  system_instructions: `Generate bullet points for each of my past jobs that demonstrate relevant achievements for the target position.

  You MUST:
  1. LANGUAGE MATCHING: Map my job history bullets to the target role's requirements using their exact phrases.
  2. RESULTS FOCUS: Emphasize quantifiable outcomes and impact
  3. TRUTHFULNESS: Only use achievements, responsibilities, and narrative points from the provided job history.
  4. SOURCE MATERIAL: Base bullet points ONLY from the information provided in:
    - The "Responsibilities" section
    - The "Achievements" section
    - The "Narrative" section

  Do NOT fabricate or combine information not explicitly stated.
  
  Example:
  Job Reqs Input:
  - Experience building and optimizing operational systems and processes
  - Ability to prioritize and organize multiple projects

  Output: 
  Optimized operational systems through detailed process documentation, reducing defects by 76% while managing over 30 clients.`,

  length_requirements: `LENGTH REQUIREMENTS are based on job duration:
  - For roles under 1 year: 1-2 bullet points, total max 30 words
  - For roles between 1-3 years: 2-3 bullet points, total max 50 words
  - For roles over 3 years: 3-5 bullet points, total max 80 words`,

  format_instructions: `For each job in my history, generate bullet points that:
- Begin with a strong action verb
- Include at least one quantifiable result when available
- Not exceed 25 words each
- End with a clear impact or outcome
- Match tone and language from the target role requirements

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
}`
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
