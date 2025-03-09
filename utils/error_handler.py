from functools import wraps
from sqlalchemy.exc import SQLAlchemyError
from telegram import Update
from telegram.error import TelegramError
from utils.logger import BotLogger

logger = BotLogger.get_logger()

def handle_errors(func):
    """Декоратор для обработки ошибок в хендлерах бота"""
    @wraps(func)
    async def wrapper(self, update: Update, context, *args, **kwargs):
        try:
            return await func(self, update, context, *args, **kwargs)
        except SQLAlchemyError as e:
            logger.error(f"Database error in {func.__name__}: {str(e)}")
            if update.callback_query:
                await update.callback_query.answer(
                    "Произошла ошибка при работе с базой данных. Попробуйте позже."
                )
            else:
                await update.message.reply_text(
                    "Произошла ошибка при работе с базой данных. Попробуйте позже."
                )
        except TelegramError as e:
            logger.error(f"Telegram API error in {func.__name__}: {str(e)}")
            # Специальная обработка ошибок Telegram API
            if "Message is not modified" in str(e):
                # Игнорируем эту ошибку, так как это нормальное поведение
                pass
            else:
                try:
                    await update.message.reply_text(
                        "Произошла ошибка при отправке сообщения. Попробуйте позже."
                    )
                except:
                    pass
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            try:
                if update.callback_query:
                    await update.callback_query.answer(
                        "Произошла непредвиденная ошибка. Мы уже работаем над её устранением."
                    )
                else:
                    await update.message.reply_text(
                        "Произошла непредвиденная ошибка. Мы уже работаем над её устранением."
                    )
            except:
                pass
            
    return wrapper

def db_session_decorator(func):
    """Декоратор для управления сессией базы данных"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        from app import db
        try:
            result = await func(*args, **kwargs)
            db.session.commit()
            return result
        except Exception as e:
            db.session.rollback()
            logger.error(f"Database session error in {func.__name__}: {str(e)}")
            raise
    return wrapper
