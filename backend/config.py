import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class Config:
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-this-in-production')

    # SQLite database stored in the backend folder
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///learning_platform.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT — tokens expire after 7 days
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-this-jwt-secret')
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES = 60 * 24 * 7  # 7 days in minutes

    # Gemini API
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')


# --- Startup warnings ---
if not Config.GEMINI_API_KEY:
    logger.warning("⚠️  GEMINI_API_KEY is not set! AI features will not work.")

if Config.SECRET_KEY == 'change-this-in-production':
    logger.warning("⚠️  SECRET_KEY is using the default value. Change it for production!")

if Config.JWT_SECRET_KEY == 'change-this-jwt-secret':
    logger.warning("⚠️  JWT_SECRET_KEY is using the default value. Change it for production!")
