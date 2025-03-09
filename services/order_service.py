from typing import List, Optional
from sqlalchemy.exc import SQLAlchemyError
from models import Order
from app import db
from services.payment_service import PaymentService
import logging

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self):
        self.payment_service = PaymentService()

    async def create_order(self, user_id: int, product_id: int) -> Order:
        try:
            order = Order(
                user_id=user_id,
                product_id=product_id,
                status='pending'
            )
            db.session.add(order)
            db.session.commit()

            # Create payment session
            payment_session = await self.payment_service.create_payment_session(order)
            order.payment_id = payment_session.id
            db.session.commit()

            return order
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when creating order: {str(e)}")
            raise

    async def get_user_orders(self, user_id: int) -> List[Order]:
        try:
            return Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching user orders: {str(e)}")
            raise

    async def get_order(self, order_id: int) -> Optional[Order]:
        try:
            return Order.query.get(order_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching order: {str(e)}")
            raise

    async def update_order_status(self, order_id: int, status: str) -> Optional[Order]:
        try:
            order = await self.get_order(order_id)
            if not order:
                return None

            order.status = status
            db.session.commit()
            return order
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when updating order status: {str(e)}")
            raise

    async def process_payment_webhook(self, payment_id: str, status: str) -> bool:
        try:
            order = Order.query.filter_by(payment_id=payment_id).first()
            if not order:
                logger.error(f"Order not found for payment_id: {payment_id}")
                return False

            if status == 'succeeded':
                order.status = 'completed'
            elif status == 'failed':
                order.status = 'failed'

            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when processing payment webhook: {str(e)}")
            raise