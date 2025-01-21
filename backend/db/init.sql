-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Base tables for CV generation
CREATE TABLE contact_info (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin TEXT
);

-- Job content table for storing processed job postings
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE professional_experience (
    id SERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    location TEXT,
    responsibilities TEXT[],
    achievements TEXT[],
    narrative TEXT[]
);

CREATE TABLE education (
    id SERIAL PRIMARY KEY,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    location TEXT,
    achievements TEXT[]
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    skills TEXT[]
);

CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    issuer TEXT,
    date DATE,
    description TEXT
);

CREATE TABLE publications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT,
    date DATE,
    url TEXT,
    description TEXT
);

-- Tables with embeddings for RAG
CREATE TABLE experience_embeddings (
    id SERIAL PRIMARY KEY,
    experience_id INTEGER REFERENCES professional_experience(id),
    context_type TEXT NOT NULL, -- 'responsibility', 'achievement', or 'narrative'
    content TEXT NOT NULL,
    embedding vector(1536)
);

CREATE TABLE education_embeddings (
    id SERIAL PRIMARY KEY,
    education_id INTEGER REFERENCES education(id),
    content TEXT NOT NULL,
    embedding vector(1536)
);

CREATE TABLE skills_embeddings (
    id SERIAL PRIMARY KEY,
    skills_id INTEGER REFERENCES skills(id),
    content TEXT NOT NULL,
    embedding vector(1536)
);

-- Create indexes for vector similarity search
CREATE INDEX experience_embedding_idx ON experience_embeddings 
    USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX education_embedding_idx ON education_embeddings 
    USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX skills_embedding_idx ON skills_embeddings 
    USING ivfflat (embedding vector_cosine_ops);

-- Create views for easy CV generation
CREATE VIEW full_experience AS
SELECT 
    pe.company,
    pe.title,
    pe.start_date,
    pe.end_date,
    pe.location,
    pe.responsibilities,
    pe.achievements,
    pe.narrative
FROM professional_experience pe
ORDER BY pe.start_date DESC;

-- Create view for RAG context
CREATE VIEW rag_context AS
SELECT 
    'experience' as source_type,
    ee.id,
    pe.company,
    pe.title,
    ee.context_type,
    ee.content,
    ee.embedding
FROM experience_embeddings ee
JOIN professional_experience pe ON ee.experience_id = pe.id
UNION ALL
SELECT 
    'education' as source_type,
    ee.id,
    e.institution as company,
    e.degree as title,
    'education' as context_type,
    ee.content,
    ee.embedding
FROM education_embeddings ee
JOIN education e ON ee.education_id = e.id; 