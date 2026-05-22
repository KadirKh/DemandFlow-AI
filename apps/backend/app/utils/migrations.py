from sqlalchemy import text
from ..logging_config import setup_logger

logger = setup_logger(__name__)

def run_schema_migrations(engine):
    """
    Ensures that any new schema columns (e.g. active, user_id in recommendations)
    are dynamically added to the existing tables for backward-compatibility.
    """
    try:
        with engine.connect() as conn:
            # Check recommendations columns
            result = conn.execute(text("PRAGMA table_info(recommendations)"))
            columns = [row[1] for row in result.fetchall()]
            
            # If recommendations table exists and has columns, verify new columns
            if columns:
                if "active" not in columns:
                    logger.info("Migrating: Adding column 'active' to 'recommendations' table.")
                    conn.execute(text("ALTER TABLE recommendations ADD COLUMN active BOOLEAN DEFAULT 1"))
                if "user_id" not in columns:
                    logger.info("Migrating: Adding column 'user_id' to 'recommendations' table.")
                    conn.execute(text("ALTER TABLE recommendations ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.commit()
    except Exception as e:
        logger.error(f"Schema migration helper encountered an error: {e}")
