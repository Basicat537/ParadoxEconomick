import pytest
from unittest.mock import patch, MagicMock
from services.product_service import ProductService
from services.user_service import UserService
from services.order_service import OrderService
from services.admin_service import AdminService
from services.payment_service import PaymentService
from models import User, Product, Order, Category, SupportTicket
from sqlalchemy.exc import SQLAlchemyError

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
        user = User(telegram_id=123456, username="test_user")
        db.session.add(user)
        
        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()
        
        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content"
        )
        db.session.add(product)
        db.session.commit()
        
        with patch('stripe.checkout.Session.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id="test_session_id")
            order = await order_service.create_order(user.id, product.id)
            
            assert order.user_id == user.id
            assert order.product_id == product.id
            assert order.status == "pending"

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
    
    async def test_get_statistics(self, admin_service):
        stats = await admin_service.get_statistics()
        assert 'total_users' in stats
        assert 'total_orders' in stats
        assert 'pending_tickets' in stats

class TestPaymentService:
    async def test_create_payment_session(self, payment_service):
        # Create test order
        user = User(telegram_id=123456, username="test_user")
        db.session.add(user)
        
        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()
        
        product = Product(
            name="Test Product",
            category_id=category.id,
            price=9.99,
            digital_content="test_content"
        )
        db.session.add(product)
        db.session.commit()
        
        order = Order(user_id=user.id, product_id=product.id)
        db.session.add(order)
        db.session.commit()
        
        with patch('stripe.checkout.Session.create') as mock_stripe:
            mock_stripe.return_value = MagicMock(id="test_session_id")
            session = await payment_service.create_payment_session(order)
            assert session.id == "test_session_id"

