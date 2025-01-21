CV & Cover Letter Generator Documentation
Overview
We're building an AI-powered system to generate customized CVs and cover letters based on:
Pre-stored job history in Q&A format
Target job description
Consistent CV structure
Data Structure
1. Job History Format
interface JobHistory {
  position: string;
  company: string;
  duration: {
    start: string;
    end: string;
  };
  responsibilities: string[];
  achievements: string[];
  skills: string[];
  qa: {
    question: string;
    answer: string;
  }[];
}
2. CV Structure
interface CV {
  personalInfo: {
    name: string;
    title: string;
    contact: {
      email: string;
      phone: string;
      location: string;
    };
  };
  summary: string;
  experience: JobHistory[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  skills: {
    technical: string[];
    soft: string[];
  };
}
Implementation Plan
1. Data Storage
Create a data folder with:
data/
  ├── job-history.json    # Your work history in Q&A format
  ├── cv-template.json    # Base CV structure
  └── prompts/
      ├── cv.ts          # CV generation prompts
      └── cover.ts       # Cover letter generation prompts

2. AI Interaction Flow
graph TD
    A[User Input] --> B[Parse Job Description or Company]
    B --> C[Match Skills & Experience]

AI Discusses with recruiter
AI Updates job mentions

    C --> D[Generate CV]
    C --> E[Generate Cover Letter]
    D --> F[Preview & Edit]
    E --> F

3. System Prompts
For CV Generation:
const CV_SYSTEM_PROMPT = `You are a professional CV writer. Using the provided job history and target position:
1. Select relevant experiences
2. Highlight matching skills
3. Quantify achievements
4. Use action verbs
5. Maintain professional tone
6. Keep to 1-2 pages`;

For Cover Letter:
const COVER_LETTER_PROMPT = `Create a compelling cover letter that:
1. Addresses key job requirements
2. Highlights relevant experience
3. Shows enthusiasm and culture fit
4. Maintains professional tone
5. Includes specific examples`;

4. Next Implementation Steps
Create data structures:


here
Set up storage:
templates
3. Update chat handler:
generation
Add document preview:
options
Would you like me to start implementing any of these components, or would you like to refine the structure further?