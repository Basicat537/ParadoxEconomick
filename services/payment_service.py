import stripe
from config import Config
from models import Order
import logging
from typing import Optional

logger = logging.getLogger(__name__)

stripe.api_key = Config.STRIPE_SECRET_KEY

class PaymentService:
    async def create_payment_session(self, order: Order) -> Optional[stripe.checkout.Session]:
        """Create a Stripe checkout session for an order"""
        try:
            if not Config.STRIPE_SECRET_KEY:
                logger.error("Stripe secret key is not configured")
                return None

            product = order.product
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': product.name,
                            'description': product.description
                        },
                        'unit_amount': int(product.price * 100)  # Convert to cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'https://t.me/{Config.BOT_USERNAME}?start=order_{order.id}_success',
                cancel_url=f'https://t.me/{Config.BOT_USERNAME}?start=order_{order.id}_cancel',
                metadata={
                    'order_id': order.id,
                    'user_id': order.user_id
                }
            )
            return session
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error when creating payment session: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error when creating payment session: {str(e)}")
            return None

    async def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature"""
        try:
            if not Config.STRIPE_WEBHOOK_SECRET:
                logger.error("Stripe webhook secret is not configured")
                return False

            stripe.Webhook.construct_event(
                payload, signature, Config.STRIPE_WEBHOOK_SECRET
            )
            return True
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return False

    async def process_refund(self, payment_id: str) -> bool:
        """Process refund for a payment"""
        try:
            if not Config.STRIPE_SECRET_KEY:
                logger.error("Stripe secret key is not configured")
                return False

            refund = stripe.Refund.create(payment_intent=payment_id)
            return refund.status == 'succeeded'
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error when processing refund: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error when processing refund: {str(e)}")
            return False