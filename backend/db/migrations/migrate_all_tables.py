import asyncio
import aiopg
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_all_tables():
    dsn = f"dbname={os.getenv('POSTGRES_DB', 'cv_rag')} user={os.getenv('POSTGRES_USER', 'cv_heathweaver')} password={os.getenv('POSTGRES_PASSWORD', 'cv_heathweaver')} host={os.getenv('POSTGRES_HOST', 'localhost')} port=5433"
    
    try:
        async with aiopg.create_pool(dsn) as pool:
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    print("Starting comprehensive migration...")

                    # Drop dependent views first
                    print("\nDropping dependent views...")
                    await cur.execute("DROP VIEW IF EXISTS full_experience;")
                    await cur.execute("DROP VIEW IF EXISTS rag_context;")

                    # Migrate professional_experience table
                    print("\nMigrating professional_experience table...")
                    await cur.execute("""
                        DO $$
                        BEGIN
                            IF EXISTS (
                                SELECT 1 
                                FROM information_schema.columns 
                                WHERE table_name = 'professional_experience' 
                                AND column_name = 'responsibilities'
                                AND data_type != 'jsonb'
                            ) THEN
                                -- Add new columns
                                ALTER TABLE professional_experience 
                                    ADD COLUMN IF NOT EXISTS responsibilities_jsonb JSONB,
                                    ADD COLUMN IF NOT EXISTS achievements_jsonb JSONB,
                                    ADD COLUMN IF NOT EXISTS narrative_jsonb JSONB;

                                -- Convert data
                                UPDATE professional_experience 
                                SET 
                                    responsibilities_jsonb = to_jsonb(responsibilities),
                                    achievements_jsonb = to_jsonb(achievements),
                                    narrative_jsonb = to_jsonb(narrative);

                                -- Drop old columns
                                ALTER TABLE professional_experience 
                                    DROP COLUMN responsibilities,
                                    DROP COLUMN achievements,
                                    DROP COLUMN narrative;

                                -- Rename new columns
                                ALTER TABLE professional_experience 
                                    RENAME COLUMN responsibilities_jsonb TO responsibilities;
                                ALTER TABLE professional_experience 
                                    RENAME COLUMN achievements_jsonb TO achievements;
                                ALTER TABLE professional_experience 
                                    RENAME COLUMN narrative_jsonb TO narrative;
                            END IF;
                        END $$;
                    """)

                    # Migrate education table
                    print("\nMigrating education table...")
                    await cur.execute("""
                        DO $$
                        BEGIN
                            IF EXISTS (
                                SELECT 1 
                                FROM information_schema.columns 
                                WHERE table_name = 'education' 
                                AND column_name = 'achievements'
                                AND data_type != 'jsonb'
                            ) THEN
                                -- Add new column
                                ALTER TABLE education 
                                    ADD COLUMN IF NOT EXISTS achievements_jsonb JSONB;

                                -- Convert data
                                UPDATE education 
                                SET achievements_jsonb = to_jsonb(achievements);

                                -- Drop old column
                                ALTER TABLE education 
                                    DROP COLUMN achievements;

                                -- Rename new column
                                ALTER TABLE education 
                                    RENAME COLUMN achievements_jsonb TO achievements;
                            END IF;
                        END $$;
                    """)

                    # Migrate skills table
                    print("\nMigrating skills table...")
                    await cur.execute("""
                        DO $$
                        BEGIN
                            IF EXISTS (
                                SELECT 1 
                                FROM information_schema.columns 
                                WHERE table_name = 'skills' 
                                AND column_name = 'skills'
                                AND data_type != 'jsonb'
                            ) THEN
                                -- Add new column
                                ALTER TABLE skills 
                                    ADD COLUMN IF NOT EXISTS skills_jsonb JSONB;

                                -- Convert data
                                UPDATE skills 
                                SET skills_jsonb = to_jsonb(skills);

                                -- Drop old column
                                ALTER TABLE skills 
                                    DROP COLUMN skills;

                                -- Rename new column
                                ALTER TABLE skills 
                                    RENAME COLUMN skills_jsonb TO skills;
                            END IF;
                        END $$;
                    """)

                    # Migrate job_content table
                    print("\nMigrating job_content table...")
                    await cur.execute("""
                        DO $$
                        BEGIN
                            IF EXISTS (
                                SELECT 1 
                                FROM information_schema.columns 
                                WHERE table_name = 'job_content' 
                                AND column_name = 'requirements'
                                AND data_type != 'jsonb'
                            ) THEN
                                -- Add new columns
                                ALTER TABLE job_content 
                                    ADD COLUMN IF NOT EXISTS requirements_jsonb JSONB,
                                    ADD COLUMN IF NOT EXISTS responsibilities_jsonb JSONB;

                                -- Convert data
                                UPDATE job_content 
                                SET 
                                    requirements_jsonb = to_jsonb(requirements),
                                    responsibilities_jsonb = to_jsonb(responsibilities);

                                -- Drop old columns
                                ALTER TABLE job_content 
                                    DROP COLUMN requirements,
                                    DROP COLUMN responsibilities;

                                -- Rename new columns
                                ALTER TABLE job_content 
                                    RENAME COLUMN requirements_jsonb TO requirements;
                                ALTER TABLE job_content 
                                    RENAME COLUMN responsibilities_jsonb TO responsibilities;
                            END IF;
                        END $$;
                    """)

                    # Add phone_numbers JSONB to contact_info
                    print("\nUpdating contact_info table...")
                    await cur.execute("""
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 
                                FROM information_schema.columns 
                                WHERE table_name = 'contact_info' 
                                AND column_name = 'phone_numbers'
                            ) THEN
                                ALTER TABLE contact_info 
                                    ADD COLUMN phone_numbers JSONB DEFAULT '{"US": null, "BE": null}'::jsonb;
                                
                                -- Migrate existing phone numbers if any
                                UPDATE contact_info 
                                SET phone_numbers = jsonb_build_object(
                                    'US', phone,
                                    'BE', null
                                )
                                WHERE phone IS NOT NULL;

                                -- Optionally drop the old phone column
                                -- ALTER TABLE contact_info DROP COLUMN phone;
                            END IF;
                        END $$;
                    """)

                    # Recreate views
                    print("\nRecreating views...")
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

                    # Verify migrations
                    print("\nVerifying migrations...")
                    tables = ['professional_experience', 'education', 'skills', 'job_content', 'contact_info']
                    for table in tables:
                        print(f"\nVerifying {table}...")
                        await cur.execute(f"SELECT * FROM {table} LIMIT 1;")
                        row = await cur.fetchone()
                        if row:
                            print(f"Sample data from {table}: {row}")

                    print("\nMigration completed successfully!")

    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(migrate_all_tables()) 