import asyncio
import os
from dotenv import load_dotenv
import aiopg
import json
from pathlib import Path

# Load environment variables from .env file
load_dotenv()

async def backup_table_data(cur, table_name, columns):
    print(f"\nFetching {table_name} data...")
    query = f"""
        SELECT {', '.join(columns)}
        FROM {table_name}
        ORDER BY id;
    """
    await cur.execute(query)
    rows = await cur.fetchall()
    
    data = []
    for row in rows:
        item = {}
        for i, col in enumerate(columns):
            if isinstance(row[i], (list, tuple)) or (hasattr(row[i], '__iter__') and not isinstance(row[i], str)):
                print(f"\n{table_name} - {col} format:", type(row[i]), row[i])
                item[col] = list(row[i]) if row[i] else []
            elif isinstance(row[i], (str, int, float)):
                item[col] = row[i]
            else:
                item[col] = row[i].isoformat() if row[i] else None
        data.append(item)
    return data

async def backup_data():
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
                # Create backup directory
                backup_dir = Path('backend/db/migrations/backup')
                backup_dir.mkdir(parents=True, exist_ok=True)
                
                # Define tables and their columns to backup
                tables = {
                    'professional_experience': [
                        'id', 'company', 'title', 'start_date', 'end_date', 'location',
                        'responsibilities', 'achievements', 'narrative'
                    ],
                    'education': [
                        'id', 'institution', 'degree', 'field', 'start_date', 'end_date',
                        'location', 'achievements'
                    ],
                    'skills': [
                        'id', 'category', 'skills'
                    ],
                    'job_content': [
                        'id', 'title', 'company', 'location', 'salary', 'description',
                        'requirements', 'responsibilities', 'about_company', 'benefits',
                        'raw_content', 'url', 'created_at'
                    ]
                }
                
                # Backup each table
                for table_name, columns in tables.items():
                    try:
                        data = await backup_table_data(cur, table_name, columns)
                        backup_file = backup_dir / f'{table_name}_backup.json'
                        with open(backup_file, 'w') as f:
                            json.dump(data, f, indent=2)
                        print(f"Backup saved to {backup_file}")
                    except Exception as e:
                        print(f"Error backing up {table_name}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(backup_data()) 