from typing import List, Optional, Dict, Any
from sqlalchemy.exc import SQLAlchemyError
from models import Order, Product, User
from app import db
from services.payment_service import PaymentService
from datetime import datetime
import logging
from utils.security import sanitize_payload
from utils.validators import InputValidator

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self):
        self.payment_service = PaymentService()
        self.validator = InputValidator()

    async def create_order(self, user_id: int, product_id: int) -> Optional[Order]:
        """Create new order with enhanced validation and security"""
        try:
            # Validate input
            if not isinstance(user_id, int) or not isinstance(product_id, int):
                logger.error(f"Invalid input types: user_id={type(user_id)}, product_id={type(product_id)}")
                return None

            # Get product and validate
            product = Product.query.get(product_id)
            if not product or not product.active:
                logger.error(f"Product not found or inactive: {product_id}")
                return None

            # Validate user
            user = User.query.get(user_id)
            if not user or not user.active:
                logger.error(f"User not found or inactive: {user_id}")
                return None

            # Create order with security tracking
            order = Order(
                user_id=user_id,
                product_id=product_id,
                status='pending',
                created_at=datetime.utcnow()
            )
            db.session.add(order)
            db.session.commit()

            logger.info(f"Created order {order.id} for user {user_id}, product {product_id}")

            # Create payment session with enhanced security
            try:
                payment_session = await self.payment_service.create_payment_session(order)
                if not payment_session:
                    logger.error(f"Failed to create payment session for order {order.id}")
                    return None

                order.payment_id = payment_session.id
                db.session.commit()

                logger.info(f"Payment session created for order {order.id}: {payment_session.id}")
                return order

            except Exception as e:
                logger.error(f"Payment session creation failed for order {order.id}: {str(e)}")
                db.session.delete(order)
                db.session.commit()
                raise

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when creating order: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error when creating order: {str(e)}")
            raise

    async def get_user_orders(self, user_id: int) -> List[Order]:
        """Get user orders with security checks"""
        try:
            # Validate user
            user = User.query.get(user_id)
            if not user or not user.active:
                logger.error(f"User not found or inactive: {user_id}")
                return []

            # Get orders with security filtering
            orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
            logger.info(f"Retrieved {len(orders)} orders for user {user_id}")
            return orders

        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching user orders: {str(e)}")
            raise

    async def get_order(self, order_id: int) -> Optional[Order]:
        """Get order with enhanced security checks"""
        try:
            order = Order.query.get(order_id)
            if not order:
                logger.warning(f"Order not found: {order_id}")
                return None

            logger.info(f"Retrieved order {order_id}")
            return order

        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching order: {str(e)}")
            raise

    async def update_order_status(self, order_id: int, status: str, metadata: Dict[str, Any] = None) -> Optional[Order]:
        """Update order status with enhanced security and validation"""
        try:
            # Validate status
            valid_statuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled']
            if status not in valid_statuses:
                logger.error(f"Invalid order status: {status}")
                return None

            order = await self.get_order(order_id)
            if not order:
                return None

            # Validate status transition
            if not self._is_valid_status_transition(order.status, status):
                logger.error(f"Invalid status transition: {order.status} -> {status}")
                return None

            # Update order with security tracking
            order.status = status
            if metadata:
                # Sanitize metadata
                metadata = sanitize_payload(metadata)
                order.metadata = metadata

            order.updated_at = datetime.utcnow()
            db.session.commit()

            logger.info(f"Updated order {order_id} status to {status}")
            return order

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when updating order status: {str(e)}")
            raise

    async def process_payment_webhook(self, payment_id: str, status: str, event_data: Dict[str, Any]) -> bool:
        """Process payment webhook with enhanced security and validation"""
        try:
            # Validate input
            if not payment_id or not status:
                logger.error("Invalid webhook data")
                return False

            # Sanitize webhook data
            event_data = sanitize_payload(event_data)

            order = Order.query.filter_by(payment_id=payment_id).first()
            if not order:
                logger.error(f"Order not found for payment_id: {payment_id}")
                return False

            # Process payment status
            if status == 'succeeded':
                await self.update_order_status(order.id, 'completed', metadata={
                    'payment_confirmed_at': datetime.utcnow().isoformat(),
                    'event_type': event_data.get('type'),
                    'payment_method': event_data.get('payment_method_types', []),
                })
            elif status == 'failed':
                await self.update_order_status(order.id, 'failed', metadata={
                    'failure_reason': event_data.get('failure_reason'),
                    'failure_message': event_data.get('failure_message'),
                })

            logger.info(f"Processed payment webhook for order {order.id}: {status}")
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when processing payment webhook: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error when processing payment webhook: {str(e)}")
            return False

    def _is_valid_status_transition(self, current_status: str, new_status: str) -> bool:
        """Validate order status transitions"""
        valid_transitions = {
            'pending': ['completed', 'failed', 'cancelled'],
            'completed': ['refunded'],
            'failed': ['pending', 'cancelled'],
            'cancelled': ['pending'],
            'refunded': []
        }
        return new_status in valid_transitions.get(current_status, [])