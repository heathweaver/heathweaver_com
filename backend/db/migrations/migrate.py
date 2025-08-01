import asyncio
import os
from dotenv import load_dotenv
import aiopg

# Load environment variables from .env file
load_dotenv()

async def run_migration():
    print("Connecting to database...")
    async with aiopg.create_pool(
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('POSTGRES_HOST'),
        port=int(os.getenv('POSTGRES_PORT', '5433'))
    ) as pool:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                print("Adding new JSONB columns...")
                await cur.execute("""
                    ALTER TABLE professional_experience 
                    ADD COLUMN responsibilities_jsonb JSONB,
                    ADD COLUMN achievements_jsonb JSONB,
                    ADD COLUMN narrative_jsonb JSONB;
                """)
                
                print("Converting data to JSONB format...")
                await cur.execute("""
                    UPDATE professional_experience 
                    SET 
                        responsibilities_jsonb = COALESCE(array_to_json(responsibilities)::jsonb, '[]'::jsonb),
                        achievements_jsonb = COALESCE(array_to_json(achievements)::jsonb, '[]'::jsonb),
                        narrative_jsonb = COALESCE(array_to_json(narrative)::jsonb, '[]'::jsonb);
                """)
                
                print("Verifying data conversion...")
                await cur.execute("""
                    SELECT 
                        responsibilities, responsibilities_jsonb,
                        achievements, achievements_jsonb,
                        narrative, narrative_jsonb
                    FROM professional_experience
                    LIMIT 1;
                """)
                row = await cur.fetchone()
                if row:
                    print("\nSample data conversion:")
                    print(f"responsibilities: {row[0]} -> {row[1]}")
                    print(f"achievements: {row[2]} -> {row[3]}")
                    print(f"narrative: {row[4]} -> {row[5]}")
                
                proceed = input("\nDoes the data look correct? Type 'yes' to proceed with dropping old columns: ")
                if proceed.lower() == 'yes':
                    print("Dropping old columns...")
                    await cur.execute("""
                        ALTER TABLE professional_experience 
                        DROP COLUMN responsibilities,
                        DROP COLUMN achievements,
                        DROP COLUMN narrative;
                    """)
                    
                    print("Renaming new columns...")
                    await cur.execute("""
                        ALTER TABLE professional_experience 
                        RENAME COLUMN responsibilities_jsonb TO responsibilities;
                        ALTER TABLE professional_experience 
                        RENAME COLUMN achievements_jsonb TO achievements;
                        ALTER TABLE professional_experience 
                        RENAME COLUMN narrative_jsonb TO narrative;
                    """)
                    print("Migration completed successfully!")
                else:
                    print("Migration stopped. New columns are still in place for verification.")
                    print("To revert, run: ALTER TABLE professional_experience DROP COLUMN responsibilities_jsonb, DROP COLUMN achievements_jsonb, DROP COLUMN narrative_jsonb;")

if __name__ == "__main__":
    asyncio.run(run_migration()) 