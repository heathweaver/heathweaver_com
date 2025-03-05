import { withClient } from "../../../lib/db/postgres-base.ts";
import { CV } from "../../../islands/shared.ts";

export class CVStorage {
  async saveCV(userId: string, title: string, cv: CV, jobTitle?: string, company?: string, metadata: Record<string, any> = {}): Promise<number> {
    return await withClient(async (client) => {
      const query = `
        INSERT INTO cvs (user_id, title, content, job_title, company, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const result = await client.queryArray(query, [
        userId,
        title,
        JSON.stringify(cv),
        jobTitle,
        company,
        JSON.stringify(metadata)
      ]);

      return result.rows[0][0] as number;
    });
  }

  async getCV(userId: string, id: number): Promise<CV | null> {
    return await withClient(async (client) => {
      const query = `
        SELECT content
        FROM cvs
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await client.queryArray(query, [id, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0][0] as CV;
    });
  }

  async updateCV(userId: string, id: number, cv: CV): Promise<void> {
    await withClient(async (client) => {
      const query = `
        UPDATE cvs
        SET content = $1
        WHERE id = $2 AND user_id = $3
      `;
      
      await client.queryArray(query, [JSON.stringify(cv), id, userId]);
    });
  }

  async listCVs(userId: string): Promise<Array<{ 
    id: number; 
    title: string; 
    job_title: string | null;
    company: string | null;
    created_at: Date; 
    updated_at: Date;
  }>> {
    return await withClient(async (client) => {
      const query = `
        SELECT id, title, job_title, company, created_at, updated_at
        FROM cvs
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `;
      
      const result = await client.queryArray(query, [userId]);
      return result.rows.map(row => ({
        id: row[0] as number,
        title: row[1] as string,
        job_title: row[2] as string | null,
        company: row[3] as string | null,
        created_at: row[4] as Date,
        updated_at: row[5] as Date
      }));
    });
  }

  async deleteCV(userId: string, id: number): Promise<void> {
    await withClient(async (client) => {
      const query = `
        DELETE FROM cvs
        WHERE id = $1 AND user_id = $2
      `;
      
      await client.queryArray(query, [id, userId]);
    });
  }
} 