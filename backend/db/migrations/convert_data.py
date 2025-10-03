import json
import yaml
from pathlib import Path

def clean_array_string(arr_str):
    """Convert PostgreSQL array format to proper list"""
    if not arr_str or arr_str == '{}':
        return []
    # Remove curly braces and split on commas
    # This handles the PostgreSQL array format {item1,item2,item3}
    if isinstance(arr_str, str) and arr_str.startswith('{') and arr_str.endswith('}'):
        items = arr_str[1:-1].split(',')
        return [item.strip().strip('"\'') for item in items if item.strip()]
    return arr_str

def convert_backup_to_yaml():
    backup_dir = Path('backend/db/migrations/backup')
    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)
    
    # Convert professional experience
    with open(backup_dir / 'professional_experience_backup.json', 'r') as f:
        exp_data = json.load(f)
        for job in exp_data:
            # Clean array fields
            job['responsibilities'] = clean_array_string(job['responsibilities'])
            job['achievements'] = clean_array_string(job['achievements'])
            job['narrative'] = clean_array_string(job['narrative'])
        
        # Save as individual YAML files
        for job in exp_data:
            company = job['company'].lower().replace(' ', '_')
            with open(data_dir / f'{company}.yml', 'w') as f:
                yaml.dump({'professional_experience': [job]}, f, sort_keys=False, allow_unicode=True)
    
    # Convert education
    with open(backup_dir / 'education_backup.json', 'r') as f:
        edu_data = json.load(f)
        for edu in edu_data:
            edu['achievements'] = clean_array_string(edu['achievements'])
        with open(data_dir / 'education.yml', 'w') as f:
            yaml.dump({'education': edu_data}, f, sort_keys=False, allow_unicode=True)
    
    # Convert skills
    with open(backup_dir / 'skills_backup.json', 'r') as f:
        skills_data = json.load(f)
        for skill in skills_data:
            skill['skills'] = clean_array_string(skill['skills'])
        with open(data_dir / 'skills.yml', 'w') as f:
            yaml.dump({'skills': skills_data}, f, sort_keys=False, allow_unicode=True)
    
    # Convert job content
    with open(backup_dir / 'job_content_backup.json', 'r') as f:
        job_content_data = json.load(f)
        for job in job_content_data:
            job['requirements'] = clean_array_string(job['requirements'])
            job['responsibilities'] = clean_array_string(job['responsibilities'])
        with open(data_dir / 'job_content.yml', 'w') as f:
            yaml.dump({'job_content': job_content_data}, f, sort_keys=False, allow_unicode=True)

if __name__ == "__main__":
    convert_backup_to_yaml() 