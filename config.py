import os
from datetime import timedelta

class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Telegram
    BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    
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

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
