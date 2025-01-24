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
  "EmailsandDeals.com": 3,
  "Essence of Email Agency": 4,
  "Trilogy Software": 2,
  "Retorica & The Specialists Agency": 2,
  "High Position Agency": 1,
  "Sony eCommerce Europe": 3,
  "Sony VAIO Europe": 3,
  "Charlotte Russe": 1
}; 