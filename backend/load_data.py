import asyncio
import yaml
import os
from pathlib import Path
import aiopg
from typing import Union, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def get_embedding(text: str) -> List[float]:
    # TODO: Implement embedding generation
    return []

def normalize_string(value: Union[str, None]) -> Union[str, None]:
    if value is None:
        return None
    return str(value).strip('"\'')

def normalize_string_list(values: List[str]) -> List[str]:
    return [normalize_string(v) for v in values if v]

def parse_date(date_str: Union[str, None]) -> Union[str, None]:
    if not date_str:
        return None
    
    date_str = normalize_string(date_str)
    
    # Handle placeholder dates
    if date_str in ['YYYY-MM', 'YYYY-MM-DD']:
        return None
    
    # Handle just year
    if len(date_str) == 4:
        return f"{date_str}-01-01"
    
    # Handle YYYY-MM
    if len(date_str) == 7:
        return f"{date_str}-01"
    
    return date_str

async def load_contact_info(conn) -> None:
    try:
        with open('data/contact_info.yml', 'r') as f:
            data = yaml.safe_load(f)
            if not data or 'contact_info' not in data:
                print("Warning: contact_info.yml is empty or missing contact_info section")
                return

            contact_data = data['contact_info']
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO contact_info (
                        full_name, email, phone, location, linkedin
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (
                    normalize_string(contact_data.get('full_name')),
                    normalize_string(contact_data.get('email')),
                    normalize_string(contact_data.get('phone')),
                    normalize_string(contact_data.get('location')),
                    normalize_string(contact_data.get('linkedin'))
                ))
    except FileNotFoundError:
        print("Warning: contact_info.yml not found")

async def normalize_job_data(job_data: Dict[str, Any]) -> Dict[str, Any]:
    responsibilities = normalize_string_list(job_data.get('responsibilities', []))
    achievements = normalize_string_list(job_data.get('achievements', []))
    narrative = normalize_string_list(job_data.get('narrative', []))
    
    return {
        'company': normalize_string(job_data.get('company')),
        'title': normalize_string(job_data.get('title')),
        'start_date': parse_date(job_data.get('start_date')),
        'end_date': parse_date(job_data.get('end_date')),
        'location': normalize_string(job_data.get('location')),
        'responsibilities': responsibilities,
        'achievements': achievements,
        'narrative': narrative
    }

async def clear_tables(conn) -> None:
    print("Clearing existing data from tables...")
    async with conn.cursor() as cur:
        await cur.execute("""
            TRUNCATE contact_info, professional_experience, education, 
                    skills, awards, publications CASCADE;
        """)
    print("Tables cleared.")

async def load_professional_experience(conn, single_job_file: str | None = None) -> None:
    # If single job file is provided, only load that one
    job_files = [single_job_file] if single_job_file else [
        'data/essence_of_email.yml',
        'data/trilogy.yml',
        'data/specialists.yml',
        'data/high_position.yml',
        'data/sony.yml',
        'data/chartlotte-russe.yml'
    ]
    
    async with conn.cursor() as cur:
        for job_file in job_files:
            try:
                with open(job_file, 'r') as f:
                    data = yaml.safe_load(f)
                    if not data:
                        print(f"Warning: {job_file} is empty")
                        continue

                    # These files use professional_experience as the key
                    jobs = data.get('professional_experience', [])
                    if not jobs:
                        print(f"Warning: No professional_experience data found in {job_file}")
                        continue

                    print(f"Loading detailed job data from {job_file}...")
                    for job in jobs:
                        normalized_job = await normalize_job_data(job)
                        
                        await cur.execute("""
                            INSERT INTO professional_experience (
                                company, title, start_date, end_date, location,
                                responsibilities, achievements, narrative
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            normalized_job['company'],
                            normalized_job['title'],
                            normalized_job['start_date'],
                            normalized_job['end_date'],
                            normalized_job['location'],
                            normalized_job['responsibilities'],
                            normalized_job['achievements'],
                            normalized_job['narrative']
                        ))
                        print(f"Added detailed job: {normalized_job['title']} at {normalized_job['company']}")
            except FileNotFoundError:
                print(f"Warning: {job_file} not found")

async def load_education(conn) -> None:
    try:
        with open('data/education.yml', 'r') as f:
            data = yaml.safe_load(f)
            if not data or not data.get('education'):
                print("Warning: education.yml is empty or missing education section")
                return

            async with conn.cursor() as cur:
                for edu in data['education']:
                    await cur.execute("""
                        INSERT INTO education (
                            institution, degree, field,
                            start_date, end_date, location, achievements
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        normalize_string(edu.get('institution')),
                        normalize_string(edu.get('degree')),
                        normalize_string(edu.get('field')),
                        parse_date(edu.get('start_date')),
                        parse_date(edu.get('end_date')),
                        normalize_string(edu.get('location')),
                        normalize_string_list(edu.get('achievements', []))
                    ))
    except FileNotFoundError:
        print("Warning: education.yml not found")

async def load_skills(conn) -> None:
    try:
        with open('data/skills.yml', 'r') as f:
            data = yaml.safe_load(f)
            if not data or not data.get('skills'):
                print("Warning: skills.yml is empty or missing skills section")
                return

            async with conn.cursor() as cur:
                for skill_group in data['skills']:
                    await cur.execute("""
                        INSERT INTO skills (
                            category, skills
                        ) VALUES (%s, %s)
                    """, (
                        normalize_string(skill_group.get('category')),
                        normalize_string_list(skill_group.get('skills', []))
                    ))
    except FileNotFoundError:
        print("Warning: skills.yml not found")

async def load_awards(conn) -> None:
    try:
        with open('data/awards.yml', 'r') as f:
            data = yaml.safe_load(f)
            if not data or not data.get('awards'):
                print("Warning: awards.yml is empty or missing awards section")
                return

            async with conn.cursor() as cur:
                for award in data['awards']:
                    await cur.execute("""
                        INSERT INTO awards (
                            title, issuer, date, description
                        ) VALUES (%s, %s, %s, %s)
                    """, (
                        normalize_string(award.get('title')),
                        normalize_string(award.get('issuer')),
                        parse_date(award.get('date')),
                        normalize_string(award.get('description'))
                    ))
    except FileNotFoundError:
        print("Warning: awards.yml not found")

async def load_publications(conn) -> None:
    try:
        with open('data/publications.yml', 'r') as f:
            data = yaml.safe_load(f)
            if not data or not data.get('publications'):
                print("Warning: publications.yml is empty or missing publications section")
                return

            async with conn.cursor() as cur:
                for pub in data['publications']:
                    await cur.execute("""
                        INSERT INTO publications (
                            title, publisher, date, url, description
                        ) VALUES (%s, %s, %s, %s, %s)
                    """, (
                        normalize_string(pub.get('title')),
                        normalize_string(pub.get('publisher')),
                        parse_date(pub.get('date')),
                        normalize_string(pub.get('url')),
                        normalize_string(pub.get('description'))
                    ))
    except FileNotFoundError:
        print("Warning: publications.yml not found")

async def main():
    # Check for single job file argument
    single_job_file = None
    if len(os.sys.argv) > 1:
        if os.sys.argv[1] == '--job':
            if len(os.sys.argv) != 3:
                print("Usage: python load_data.py --job <path_to_job_yaml>")
                return
            single_job_file = os.sys.argv[2]
            print(f"Loading single job file: {single_job_file}")

    try:
        print("Connecting to database...")
        async with aiopg.create_pool(
            database=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            host=os.getenv('POSTGRES_HOST'),
            port=int(os.getenv('POSTGRES_PORT', '5433'))
        ) as pool:
            async with pool.acquire() as conn:
                if single_job_file:
                    # Only load the single job
                    await load_professional_experience(conn, single_job_file)
                else:
                    # Clear existing data first
                    await clear_tables(conn)
                    
                    print("Loading contact info...")
                    await load_contact_info(conn)
                    
                    print("Loading professional experience...")
                    await load_professional_experience(conn)
                    
                    print("Loading education...")
                    await load_education(conn)
                    
                    print("Loading skills...")
                    await load_skills(conn)
                    
                    print("Loading awards...")
                    await load_awards(conn)
                    
                    print("Loading publications...")
                    await load_publications(conn)
                
                print("Data loading complete!")
    except Exception as e:
        print(f"Error: {e}")
        print(f"Error type: {type(e)}")
        if hasattr(e, 'pgcode'):
            print(f"PostgreSQL error code: {e.pgcode}")
        if hasattr(e, 'pgerror'):
            print(f"PostgreSQL error message: {e.pgerror}")

if __name__ == '__main__':
    asyncio.run(main()) 