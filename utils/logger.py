import logging
import sys
from logging.handlers import RotatingFileHandler
from typing import Optional

class BotLogger:
    _instance: Optional['BotLogger'] = None
    
    def __init__(self):
        self.logger = logging.getLogger('telegram_bot')
        self.logger.setLevel(logging.DEBUG)
        
        # Форматтер для логов
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
        )
        
        # Хендлер для консоли
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.INFO)
        
        # Хендлер для файла
        file_handler = RotatingFileHandler(
            'bot.log',
            maxBytes=10485760,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.DEBUG)
        
        # Добавляем хендлеры
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
    
    @classmethod
    def get_logger(cls) -> logging.Logger:
        if cls._instance is None:
            cls._instance = BotLogger()
        return cls._instance.logger

    @staticmethod
    def log_request(update, context, level=logging.INFO):
        logger = BotLogger.get_logger()
        user = update.effective_user
        message = update.message or update.callback_query.message
        
        log_data = {
            'user_id': user.id,
            'username': user.username,
            'chat_id': message.chat_id if message else None,
            'message_id': message.message_id if message else None,
            'text': update.message.text if update.message else None,
            'callback_data': update.callback_query.data if update.callback_query else None
        }
        
        logger.log(level, f"Incoming request: {log_data}")
