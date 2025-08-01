import asyncio
import aiopg
import os
from dotenv import load_dotenv

load_dotenv()

async def run_migration():
    # Get database connection details from environment variables
    dsn = f"dbname={os.getenv('POSTGRES_DB', 'cv_rag')} user={os.getenv('POSTGRES_USER', 'cv_heathweaver')} password={os.getenv('POSTGRES_PASSWORD', 'cv_heathweaver')} host={os.getenv('POSTGRES_HOST', 'localhost')} port=5433"
    
    try:
        async with aiopg.create_pool(dsn) as pool:
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    print("Starting migration...")
                    
                    # Add new JSONB columns
                    print("Adding new JSONB columns...")
                    await cur.execute("""
                        ALTER TABLE professional_experience 
                        ADD COLUMN IF NOT EXISTS responsibilities_jsonb JSONB,
                        ADD COLUMN IF NOT EXISTS achievements_jsonb JSONB,
                        ADD COLUMN IF NOT EXISTS narrative_jsonb JSONB;
                    """)
                    
                    # Copy data to new columns
                    print("Converting and copying data to JSONB columns...")
                    await cur.execute("""
                        UPDATE professional_experience 
                        SET 
                            responsibilities_jsonb = to_jsonb(responsibilities),
                            achievements_jsonb = to_jsonb(achievements),
                            narrative_jsonb = to_jsonb(narrative);
                    """)
                    
                    # Verify the data
                    print("\nVerifying data conversion...")
                    await cur.execute("""
                        SELECT id, responsibilities, responsibilities_jsonb,
                               achievements, achievements_jsonb,
                               narrative, narrative_jsonb 
                        FROM professional_experience 
                        LIMIT 1;
                    """)
                    
                    row = await cur.fetchone()
                    if row:
                        print("\nSample data verification:")
                        print(f"ID: {row[0]}")
                        print(f"Responsibilities (old): {row[1]}")
                        print(f"Responsibilities (new): {row[2]}")
                        print(f"Achievements (old): {row[3]}")
                        print(f"Achievements (new): {row[4]}")
                        print(f"Narrative (old): {row[5]}")
                        print(f"Narrative (new): {row[6]}")
                    
                    print("\nMigration completed successfully!")
                    print("\nNEXT STEPS:")
                    print("1. Review the sample data above to ensure the conversion was successful")
                    print("2. If the data looks correct, you can run the following commands to complete the migration:")
                    print("""
    ALTER TABLE professional_experience 
        DROP COLUMN responsibilities,
        DROP COLUMN achievements,
        DROP COLUMN narrative;

    ALTER TABLE professional_experience 
        RENAME COLUMN responsibilities_jsonb TO responsibilities,
        RENAME COLUMN achievements_jsonb TO achievements,
        RENAME COLUMN narrative_jsonb TO narrative;
                    """)
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration()) 