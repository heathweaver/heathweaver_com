// Basic information that doesn't change
export interface BasicInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
}

// Core job history that doesn't change
interface BaseJobHistory {
  company: string;
  position: string;
  duration: {
    start: string;
    end: string;
  };
  location: string;
}

// Achievements and responsibilities that can be customized
interface JobDetails {
  achievements: string[];
  skills: string[];
  projects: string[];
  impact: string[];
}

// Questions for customization
interface JobQuestion {
  id: string;
  question: string;
  context: string;
  type: "achievement" | "skill" | "project" | "impact";
}

// The complete job history with all possible details
interface FullJobHistory extends BaseJobHistory {
  details: JobDetails;
  questions: JobQuestion[];
}

export interface BulletPoint {
  content: string;
}

export interface JobEntry {
  title: string;
  date: string;
  location?: string;
  bulletPoints: BulletPoint[];
}

export interface EmploymentHistoryItem {
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  location?: string;
  responsibilities?: string[];
  achievements?: string[];
  narrative?: string[];
  bulletPoints: { content: string }[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  achievements?: string[];
}

export interface SkillItem {
    category: string;
    skills: string[];
}

export interface AwardItem {
    title: string;
    issuer?: string;
    date?: string;
    description?: string;
}

export interface PublicationItem {
    title: string;
    publisher?: string;
    date?: string;
    url?: string;
    description?: string;
}

export interface CV {
  basicInfo: BasicInfo;
  profile: string;
  employmentHistory: EmploymentHistoryItem[];
  certificatesAndAwards: string[];
  contact: any;
  experience: any[];
  education: EducationItem[];
  skills: SkillItem[];
  awards: AwardItem[];
  publications: PublicationItem[];
}

export interface CVGenerationPrompt {
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string;
  responsibilities: string;
}

export interface JobHistory {
  id: number;
  company: string;
  title: string;
  start_date: Date;
  end_date: Date | null;
  responsibilities: string[];
  achievements: string[];
  narrative: string[];
  location?: string;
}

export interface CVData {
  basicInfo: BasicInfo;
  jobHistory: FullJobHistory[];
} 