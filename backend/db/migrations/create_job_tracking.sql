CREATE TABLE job_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id CHAR(10) REFERENCES users(id),
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_applied TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('saved', 'applied', 'interviewing', 'offer', 'closed')),
  job_url TEXT,
  job_description TEXT,
  notes TEXT,
  cv_id INTEGER REFERENCES cvs(id),
  CONSTRAINT unique_job_application UNIQUE (user_id, company_name, job_title)
);

-- Index for CV relationship
CREATE INDEX idx_job_tracking_cv_id ON job_tracking(cv_id); 