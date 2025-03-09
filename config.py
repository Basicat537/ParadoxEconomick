import os
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Telegram
    BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    BOT_USERNAME = os.getenv('BOT_USERNAME', 'your_bot_username')  # Добавлен BOT_USERNAME

    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-prod')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-prod')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # Rate limiting
    RATE_LIMIT_MESSAGES = 30  # messages per minute
    RATE_LIMIT_COMMANDS = 10  # commands per minute

    # Admin settings
    ADMIN_USERNAMES = os.getenv('ADMIN_USERNAMES', '').split(',')

    # Payment
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

    # App config
    APP_NAME = "Digital Products Bot"
    VERSION = "1.0.0"

    @classmethod
    def check_required_vars(cls):
        required_vars = {
            'DATABASE_URL': cls.SQLALCHEMY_DATABASE_URI,
            'TELEGRAM_BOT_TOKEN': cls.BOT_TOKEN,
            'BOT_USERNAME': cls.BOT_USERNAME,
        }

        logger.info("Checking required environment variables...")
        for var_name, value in required_vars.items():
            if not value:
                logger.error(f"Missing required environment variable: {var_name}")
            else:
                logger.info(f"Found environment variable: {var_name}")

        missing_vars = [key for key, value in required_vars.items() if not value]
        if missing_vars:
            error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
            logger.critical(error_msg)
            raise ValueError(error_msg)

        logger.info("All required environment variables are present")

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')