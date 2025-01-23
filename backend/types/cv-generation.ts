export interface GenerateOptions {
  jobId?: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string;
  responsibilities: string;
  bulletPointConfig?: CompanyBulletConfig;
}

export interface CompanyBulletConfig {
  [company: string]: number;
}

// Default bullet point configuration
export const DEFAULT_BULLET_CONFIG: CompanyBulletConfig = {
  "Essence of Email": 4,
  "Trilogy": 2,
  "Specialists": 2,
  "High Position": 3,
  "Sony Marketing": 3,
  "Sony Finance": 3,
  "Charlotte Russe": 1
}; 