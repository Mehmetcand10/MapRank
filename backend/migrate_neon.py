import os
import sys
from alembic import command
from alembic.config import Config

# Set the DATABASE_URL environment variable to the Neon connection string
# Note: In a real production env, this should be set in the system environment variables
os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_3SUNkR4ZCEHQ@ep-restless-waterfall-ai8isv6q-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Create Alembic configuration object
alembic_cfg = Config("alembic.ini")

# Run the migration
try:
    print("Starting migration to Neon DB...")
    command.upgrade(alembic_cfg, "head")
    print("Migration successful!")
except Exception as e:
    print(f"Migration failed: {e}")
