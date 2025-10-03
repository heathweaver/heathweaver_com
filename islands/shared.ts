import { signal } from "@preact/signals";

export interface CV {
  id: number;
  basicInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  profile?: string;
  employmentHistory: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
    location?: string;
    responsibilities?: string[];
    achievements?: string[];
    narrative?: string[];
    bulletPoints: Array<{ content: string }>;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    location?: string;
    start_date: string;
    end_date?: string;
  }>;
  skills: Array<{
    category: string;
    skills: string[];
  }>;
  certificatesAndAwards?: string[];
  awards?: Array<{
    title: string;
    issuer: string;
  }>;
  publications?: Array<{
    title: string;
    publisher: string;
    url: string;
    description: string;
  }>;
}

export const cvSignal = signal<CV | null>(null);
