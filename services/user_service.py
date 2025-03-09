from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from models import User
from app import db, app
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        # Initialize service within app context
        with app.app_context():
            logger.info("Initializing UserService")

    async def get_user(self, telegram_id: int) -> Optional[User]:
        try:
            with app.app_context():
                return User.query.filter_by(telegram_id=telegram_id).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching user: {str(e)}")
            raise

    async def create_user_if_not_exists(self, telegram_user) -> User:
        try:
            with app.app_context():
                user = await self.get_user(telegram_user.id)
                if user:
                    return user

                user = User(
                    telegram_id=telegram_user.id,
                    username=telegram_user.username,
                    active=True
                )
                db.session.add(user)
                db.session.commit()
                return user
        except SQLAlchemyError as e:
            with app.app_context():
                db.session.rollback()
            logger.error(f"Database error when creating user: {str(e)}")
            raise

    async def update_user(self, telegram_id: int, data: dict) -> Optional[User]:
        try:
            with app.app_context():
                user = await self.get_user(telegram_id)
                if not user:
                    return None

                for key, value in data.items():
                    if hasattr(user, key):
                        setattr(user, key, value)

                db.session.commit()
                return user
        except SQLAlchemyError as e:
            with app.app_context():
                db.session.rollback()
            logger.error(f"Database error when updating user: {str(e)}")
            raise

    async def deactivate_user(self, telegram_id: int) -> bool:
        try:
            with app.app_context():
                user = await self.get_user(telegram_id)
                if not user:
                    return False

                user.active = False
                db.session.commit()
                return True
        except SQLAlchemyError as e:
            with app.app_context():
                db.session.rollback()
            logger.error(f"Database error when deactivating user: {str(e)}")
            raise

    async def get_user_profile(self, telegram_id: int) -> dict:
        try:
            with app.app_context():
                user = await self.get_user(telegram_id)
                if not user:
                    return None

                return {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'active': user.active,
                    'created_at': user.created_at,
                    'orders_count': len(user.orders)
                }
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching user profile: {str(e)}")
            raise