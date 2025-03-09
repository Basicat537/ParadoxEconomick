from typing import List
from sqlalchemy.exc import SQLAlchemyError
from models import User, Product, Order, SupportTicket, TicketResponse
from app import db
from config import Config
import logging

logger = logging.getLogger(__name__)

class AdminService:
    async def is_admin(self, telegram_id: int) -> bool:
        try:
            user = User.query.filter_by(telegram_id=telegram_id).first()
            return user and user.username in Config.ADMIN_USERNAMES
        except SQLAlchemyError as e:
            logger.error(f"Database error when checking admin status: {str(e)}")
            raise

    async def get_all_users(self) -> List[User]:
        try:
            return User.query.all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching users: {str(e)}")
            raise

    async def get_all_orders(self) -> List[Order]:
        try:
            return Order.query.order_by(Order.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching orders: {str(e)}")
            raise

    async def get_support_tickets(self, status: str = None) -> List[SupportTicket]:
        try:
            query = SupportTicket.query
            if status:
                query = query.filter_by(status=status)
            return query.order_by(SupportTicket.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching support tickets: {str(e)}")
            raise

    async def respond_to_ticket(self, ticket_id: int, admin_id: int, message: str) -> bool:
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False

            response = TicketResponse(
                ticket_id=ticket_id,
                admin_id=admin_id,
                message=message
            )
            db.session.add(response)
            ticket.status = 'answered'
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when responding to ticket: {str(e)}")
            raise

    async def get_statistics(self) -> dict:
        try:
            return {
                'total_users': User.query.count(),
                'total_orders': Order.query.count(),
                'completed_orders': Order.query.filter_by(status='completed').count(),
                'pending_tickets': SupportTicket.query.filter_by(status='open').count(),
                'active_products': Product.query.filter_by(active=True).count()
            }
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching statistics: {str(e)}")
            raise

    async def update_product(self, product_id: int, data: dict) -> bool:
        try:
            product = Product.query.get(product_id)
            if not product:
                return False

            for key, value in data.items():
                if hasattr(product, key):
                    setattr(product, key, value)

            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when updating product: {str(e)}")
            raise