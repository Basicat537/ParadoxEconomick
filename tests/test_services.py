import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from services.product_service import ProductService
from services.user_service import UserService
from services.order_service import OrderService
from services.admin_service import AdminService
from services.payment_service import PaymentService
from models import User, Product, Order, Category, SupportTicket
from sqlalchemy.exc import SQLAlchemyError
import stripe

@pytest.fixture
def product_service():
    return ProductService()

@pytest.fixture
def user_service():
    return UserService()

@pytest.fixture
def order_service():
    return OrderService()

@pytest.fixture
def admin_service():
    return AdminService()

@pytest.fixture
def payment_service():
    return PaymentService()

class TestProductService:
    async def test_get_categories(self, product_service):
        # Create test category
        category = Category(name="Test Category", description="Test Description")
        db.session.add(category)
        db.session.commit()

        categories = await product_service.get_categories()
        assert len(categories) > 0
        assert categories[0].name == "Test Category"

    async def test_get_products_by_category(self, product_service):
        # Create test category and product
        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        products = await product_service.get_products_by_category(category.id)
        assert len(products) == 1
        assert products[0].name == "Test Product"

class TestUserService:
    async def test_create_user(self, user_service):
        telegram_user = MagicMock()
        telegram_user.id = 123456
        telegram_user.username = "test_user"

        user = await user_service.create_user_if_not_exists(telegram_user)
        assert user.telegram_id == 123456
        assert user.username == "test_user"

    async def test_get_user_profile(self, user_service):
        # Create test user
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        profile = await user_service.get_user_profile(123456)
        assert profile['username'] == "test_user"
        assert profile['active'] is True

class TestOrderService:
    async def test_create_order(self, order_service):
        # Create test user and product
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        with patch('stripe.checkout.Session.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id="test_session_id")
            order = await order_service.create_order(user.id, product.id)

            assert order.user_id == user.id
            assert order.product_id == product.id
            assert order.status == "pending"
            assert order.payment_id == "test_session_id"

    async def test_invalid_order_creation(self, order_service):
        # Test creating order with invalid user
        with pytest.raises(Exception):
            await order_service.create_order(999999, 1)

        # Test creating order with invalid product
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        with pytest.raises(Exception):
            await order_service.create_order(user.id, 999999)

    async def test_order_status_transitions(self, order_service):
        # Create test order
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)

        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        with patch('stripe.checkout.Session.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id="test_session_id")
            order = await order_service.create_order(user.id, product.id)

            # Test valid transitions
            updated_order = await order_service.update_order_status(order.id, "completed")
            assert updated_order.status == "completed"

            updated_order = await order_service.update_order_status(order.id, "refunded")
            assert updated_order.status == "refunded"

            # Test invalid transition
            invalid_order = await order_service.update_order_status(order.id, "pending")
            assert invalid_order is None

class TestPaymentService:
    async def test_create_payment_session(self, payment_service):
        # Create test order
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        order = Order(user_id=user.id, product_id=product.id, status="pending")
        db.session.add(order)
        db.session.commit()

        with patch('stripe.checkout.Session.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id="test_session_id")
            session = await payment_service.create_payment_session(order)
            assert session.id == "test_session_id"

    async def test_suspicious_activity_detection(self, payment_service):
        user_id = 123456

        # Create multiple payment attempts
        for _ in range(payment_service._fraud_check_threshold + 1):
            is_suspicious = await payment_service._check_suspicious_activity(user_id)
            if _ < payment_service._fraud_check_threshold:
                assert not is_suspicious
            else:
                assert is_suspicious

    async def test_webhook_signature_verification(self, payment_service):
        with patch('stripe.Webhook.construct_event') as mock_verify:
            # Test valid signature
            mock_verify.return_value = MagicMock(
                type="payment_intent.succeeded",
                data={"object": {"id": "test_payment"}}
            )
            result = await payment_service.verify_webhook_signature(b"payload", "signature")
            assert result is True

            # Test invalid signature
            mock_verify.side_effect = stripe.error.SignatureVerificationError("Invalid", "sig")
            result = await payment_service.verify_webhook_signature(b"payload", "invalid_sig")
            assert result is False

    async def test_refund_processing(self, payment_service):
        with patch('stripe.Refund.create') as mock_refund:
            # Test successful refund
            mock_refund.return_value = MagicMock(status="succeeded")
            result = await payment_service.process_refund("test_payment", "requested_by_customer")
            assert result is True

            # Test failed refund
            mock_refund.side_effect = stripe.error.StripeError("Refund failed")
            with pytest.raises(stripe.error.StripeError):
                await payment_service.process_refund("test_payment")

class TestAdminService:
    async def test_is_admin(self, admin_service):
        # Create admin user
        user = User(
            telegram_id=123456,
            username=Config.ADMIN_USERNAMES[0],
            active=True
        )
        db.session.add(user)
        db.session.commit()

        is_admin = await admin_service.is_admin(123456)
        assert is_admin is True

        # Test non-admin user
        non_admin = User(telegram_id=654321, username="regular_user", active=True)
        db.session.add(non_admin)
        db.session.commit()

        is_admin = await admin_service.is_admin(654321)
        assert is_admin is False

    async def test_get_statistics(self, admin_service):
        stats = await admin_service.get_statistics()
        assert 'total_users' in stats
        assert 'total_orders' in stats
        assert 'pending_tickets' in stats
        assert 'total_revenue' in stats
        assert 'active_products' in stats


class TestAdminServiceExtended:
    async def test_user_filtering(self, admin_service):
        # Create test users
        user1 = User(telegram_id=123456, username="active_user", active=True)
        user2 = User(telegram_id=654321, username="inactive_user", active=False)
        db.session.add_all([user1, user2])
        db.session.commit()

        # Test active filter
        active_users = await admin_service.get_all_users({'active': True})
        assert len(active_users) == 1
        assert active_users[0].username == "active_user"

        # Test search filter
        search_users = await admin_service.get_all_users({'search': 'inactive'})
        assert len(search_users) == 1
        assert search_users[0].username == "inactive_user"

    async def test_order_filtering(self, admin_service):
        # Create test user and order
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        order = Order(
            user_id=user.id,
            product_id=product.id,
            status="completed",
            created_at=datetime.utcnow()
        )
        db.session.add(order)
        db.session.commit()

        # Test status filter
        completed_orders = await admin_service.get_all_orders({'status': 'completed'})
        assert len(completed_orders) == 1
        assert completed_orders[0].status == "completed"

        # Test user filter
        user_orders = await admin_service.get_all_orders({'user_id': user.id})
        assert len(user_orders) == 1
        assert user_orders[0].user_id == user.id

    async def test_ticket_management(self, admin_service):
        # Create test user and ticket
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        ticket = SupportTicket(
            user_id=user.id,
            subject="Test Ticket",
            message="Test message",
            status="open",
            created_at=datetime.utcnow()
        )
        db.session.add(ticket)
        db.session.commit()

        # Test ticket response
        success = await admin_service.respond_to_ticket(
            ticket.id,
            user.id,  # Admin ID
            "Test response"
        )
        assert success is True

        # Verify ticket status update
        updated_ticket = SupportTicket.query.get(ticket.id)
        assert updated_ticket.status == "answered"
        assert updated_ticket.last_response_at is not None

    async def test_detailed_statistics(self, admin_service):
        # Create test data
        user = User(telegram_id=123456, username="test_user", active=True)
        db.session.add(user)
        db.session.commit()

        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        order = Order(
            user_id=user.id,
            product_id=product.id,
            status="completed",
            created_at=datetime.utcnow()
        )
        db.session.add(order)
        db.session.commit()

        # Get statistics
        stats = await admin_service.get_statistics()

        # Verify basic stats
        assert stats['total_users'] > 0
        assert stats['total_orders'] > 0
        assert 'total_revenue' in stats
        assert stats['active_products'] > 0

        # Verify time-based stats
        assert 'time_stats' in stats
        assert 'new_users_24h' in stats['time_stats']
        assert 'orders_24h' in stats['time_stats']

        # Verify support stats
        assert 'support_stats' in stats
        assert 'average_response_time' in stats['support_stats']

    async def test_product_updates(self, admin_service):
        # Create test product
        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        # Update product
        update_data = {
            'name': "Updated Product",
            'price': 19.99,
            'active': False
        }
        success = await admin_service.update_product(product.id, update_data)
        assert success is True

        # Verify updates
        updated_product = Product.query.get(product.id)
        assert updated_product.name == "Updated Product"
        assert updated_product.price == 19.99
        assert updated_product.active is False