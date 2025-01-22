DROP TABLE IF EXISTS job_content;

CREATE TABLE job_content (
    id TEXT PRIMARY KEY,  -- 20-char hex code
    title TEXT,
    company TEXT,
    location TEXT,
    salary TEXT,
    description TEXT,
    requirements TEXT[],
    responsibilities TEXT[],
    about_company TEXT,
    benefits TEXT,
    raw_content TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
); 