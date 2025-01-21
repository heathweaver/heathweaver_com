import { parse } from 'yaml';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import fs from 'fs/promises';
import pg from 'pg';

const embeddings = new OpenAIEmbeddings();

const pool = new pg.Pool({
  user: 'cv_heathweaver',
  host: 'localhost',
  database: 'cv_rag',
  password: 'cv_heathweaver',
  port: 5432,
});

async function getEmbedding(text: string) {
  const [embedding] = await embeddings.embedDocuments([text]);
  return embedding;
}

async function loadJobHistory() {
  const jobHistoryFile = await fs.readFile('../data/job_history.yml', 'utf-8');
  const jobHistory = parse(jobHistoryFile);

  for (const job of jobHistory) {
    const descriptionText = `${job.position} at ${job.company}. ${job.description}`;
    const embedding = await getEmbedding(descriptionText);

    await pool.query(
      `INSERT INTO job_history 
       (company, position, start_date, end_date, description, skills, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        job.company,
        job.position,
        job.startDate,
        job.endDate,
        job.description,
        job.skills,
        embedding,
      ]
    );
  }
}

async function main() {
  try {
    await loadJobHistory();
    // Add similar functions for education and projects
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    await pool.end();
  }
}

main(); 