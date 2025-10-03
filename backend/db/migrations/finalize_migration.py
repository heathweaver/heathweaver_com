import asyncio
import aiopg
import os
from dotenv import load_dotenv

load_dotenv()

async def finalize_migration():
    # Get database connection details from environment variables
    dsn = f"dbname={os.getenv('POSTGRES_DB', 'cv_rag')} user={os.getenv('POSTGRES_USER', 'cv_heathweaver')} password={os.getenv('POSTGRES_PASSWORD', 'cv_heathweaver')} host={os.getenv('POSTGRES_HOST', 'localhost')} port=5433"
    
    try:
        async with aiopg.create_pool(dsn) as pool:
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    print("Starting final migration steps...")
                    
                    # Drop the dependent view first
                    print("Dropping dependent view...")
                    await cur.execute("DROP VIEW IF EXISTS full_experience;")
                    
                    # Check if old columns exist before dropping
                    print("Checking and dropping old TEXT[] columns if they exist...")
                    await cur.execute("""
                        DO $$
                        BEGIN
                            IF EXISTS (
                                SELECT 1 
                                FROM information_schema.columns 
                                WHERE table_name = 'professional_experience' 
                                AND column_name = 'responsibilities'
                            ) THEN
                                ALTER TABLE professional_experience 
                                    DROP COLUMN responsibilities,
                                    DROP COLUMN achievements,
                                    DROP COLUMN narrative;
                            END IF;
                        END $$;
                    """)
                    
                    # Rename new columns (one at a time)
                    print("Renaming JSONB columns...")
                    await cur.execute("""
                        ALTER TABLE professional_experience 
                            RENAME COLUMN responsibilities_jsonb TO responsibilities;
                    """)
                    await cur.execute("""
                        ALTER TABLE professional_experience 
                            RENAME COLUMN achievements_jsonb TO achievements;
                    """)
                    await cur.execute("""
                        ALTER TABLE professional_experience 
                            RENAME COLUMN narrative_jsonb TO narrative;
                    """)
                    
                    # Recreate the view with the new column names
                    print("Recreating view...")
                    await cur.execute("""
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
                    """)
                    
                    # Verify the final structure
                    print("\nVerifying final table structure...")
                    await cur.execute("""
                        SELECT id, responsibilities, achievements, narrative
                        FROM professional_experience 
                        LIMIT 1;
                    """)
                    
                    row = await cur.fetchone()
                    if row:
                        print("\nFinal data verification:")
                        print(f"ID: {row[0]}")
                        print(f"Responsibilities: {row[1]}")
                        print(f"Achievements: {row[2]}")
                        print(f"Narrative: {row[3]}")
                    
                    print("\nMigration finalized successfully!")
                    print("All columns have been converted to JSONB format and the view has been recreated.")
    
    except Exception as e:
        print(f"Error during migration finalization: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(finalize_migration()) 