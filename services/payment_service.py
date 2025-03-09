import stripe
from config import Config
from models import Order, User
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from utils.security import sanitize_payload
from utils.validators import InputValidator

logger = logging.getLogger(__name__)

stripe.api_key = Config.STRIPE_SECRET_KEY

class PaymentService:
    def __init__(self):
        self.validator = InputValidator()
        self._fraud_check_threshold = 3  # Maximum failed attempts before additional verification
        self._suspicious_activities = {}  # Track suspicious payment activities

    async def create_payment_session(self, order: Order) -> Optional[stripe.checkout.Session]:
        """Create a Stripe checkout session for an order with enhanced security"""
        try:
            if not Config.STRIPE_SECRET_KEY:
                logger.error("Stripe secret key is not configured")
                return None

            # Validate order data
            if not order or not order.product:
                logger.error(f"Invalid order data: {order}")
                return None

            # Check for suspicious activity
            if await self._check_suspicious_activity(order.user_id):
                logger.warning(f"Suspicious activity detected for user {order.user_id}")
                return None

            # Create Stripe session with additional security measures
            product = order.product
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': product.name,
                            'description': product.description,
                            'metadata': {
                                'product_id': product.id,
                                'order_id': order.id
                            }
                        },
                        'unit_amount': int(product.price * 100)  # Convert to cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'https://t.me/{Config.BOT_USERNAME}?start=order_{order.id}_success',
                cancel_url=f'https://t.me/{Config.BOT_USERNAME}?start=order_{order.id}_cancel',
                customer_email=order.user.email if order.user.email else None,
                metadata={
                    'order_id': order.id,
                    'user_id': order.user_id,
                    'product_id': product.id,
                    'timestamp': datetime.utcnow().isoformat()
                },
                payment_intent_data={
                    'setup_future_usage': 'off_session',
                    'capture_method': 'automatic',
                    'statement_descriptor': 'Digital Product',
                    'metadata': {
                        'order_id': order.id,
                        'user_id': order.user_id
                    }
                }
            )

            # Log payment attempt
            logger.info(f"Created payment session for order {order.id}, user {order.user_id}")
            return session

        except stripe.error.StripeError as e:
            await self._handle_stripe_error(e, order)
            raise
        except Exception as e:
            logger.error(f"Unexpected error when creating payment session: {str(e)}")
            return None

    async def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature with enhanced security"""
        try:
            if not Config.STRIPE_WEBHOOK_SECRET:
                logger.error("Stripe webhook secret is not configured")
                return False

            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload, signature, Config.STRIPE_WEBHOOK_SECRET
            )

            # Validate event data
            if not event or not event.type or not event.data:
                logger.error("Invalid webhook event data")
                return False

            # Log webhook event
            logger.info(f"Received valid webhook event: {event.type}")
            return True

        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in webhook verification: {str(e)}")
            return False

    async def process_refund(self, payment_id: str, reason: str = None) -> bool:
        """Process refund with enhanced security and validation"""
        try:
            if not Config.STRIPE_SECRET_KEY:
                logger.error("Stripe secret key is not configured")
                return False

            # Validate payment ID
            if not payment_id or not isinstance(payment_id, str):
                logger.error("Invalid payment ID")
                return False

            # Sanitize reason if provided
            if reason:
                reason = sanitize_payload(reason)

            # Create refund with additional metadata
            refund = stripe.Refund.create(
                payment_intent=payment_id,
                reason=reason if reason in ['requested_by_customer', 'duplicate', 'fraudulent'] else 'other',
                metadata={
                    'initiated_at': datetime.utcnow().isoformat(),
                    'reason': reason
                }
            )

            # Log refund
            logger.info(f"Processed refund for payment {payment_id}: {refund.status}")
            return refund.status == 'succeeded'

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error when processing refund: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error when processing refund: {str(e)}")
            return False

    async def _check_suspicious_activity(self, user_id: int) -> bool:
        """Check for suspicious payment activity"""
        current_time = datetime.utcnow()
        user_activity = self._suspicious_activities.get(user_id, {
            'attempts': 0,
            'first_attempt': current_time
        })

        # Reset if more than 24 hours passed
        if current_time - user_activity['first_attempt'] > timedelta(hours=24):
            user_activity = {
                'attempts': 1,
                'first_attempt': current_time
            }
        else:
            user_activity['attempts'] += 1

        self._suspicious_activities[user_id] = user_activity
        return user_activity['attempts'] > self._fraud_check_threshold

    async def _handle_stripe_error(self, error: stripe.error.StripeError, order: Order) -> None:
        """Handle Stripe errors with detailed logging"""
        error_data = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'order_id': order.id if order else None,
            'user_id': order.user_id if order else None,
            'timestamp': datetime.utcnow().isoformat()
        }
        logger.error(f"Stripe error occurred: {error_data}")

        if isinstance(error, stripe.error.CardError):
            # Handle card errors (e.g., insufficient funds, expired card)
            logger.warning(f"Card error for order {order.id}: {error.code}")
        elif isinstance(error, stripe.error.InvalidRequestError):
            # Handle invalid parameters
            logger.error(f"Invalid request error: {error.param}")
        elif isinstance(error, stripe.error.AuthenticationError):
            # Handle authentication errors
            logger.critical("Stripe authentication failed. Check API keys.")