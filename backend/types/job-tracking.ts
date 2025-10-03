export type JobStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "closed";

export interface JobTracking {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  createdDate: Date;
  dateApplied?: Date;
  status: JobStatus;
  jobUrl?: string;
  jobDescription?: string;
  notes?: string;
  cvId?: number;
}

export interface JobTrackingFilters {
  status?: JobStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}
