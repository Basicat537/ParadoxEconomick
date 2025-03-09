import pytest
from unittest.mock import MagicMock, patch, call
from telegram import Update, User as TelegramUser
from telegram.ext import ContextTypes
from bot import TelegramBot
from models import User, Category, Product, Order
from config import Config
from app import app, db
import asyncio

@pytest.fixture
def test_app():
    """Create a test Flask app and database"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def bot():
    return TelegramBot()

@pytest.fixture
def update():
    update = MagicMock(spec=Update)
    update.effective_user = MagicMock(spec=TelegramUser)
    update.effective_user.id = 123456
    update.effective_user.username = "test_user"
    update.effective_user.first_name = "Test"
    update.message = MagicMock()
    return update

@pytest.fixture
def context():
    return MagicMock(spec=ContextTypes.DEFAULT_TYPE)

@pytest.mark.asyncio
async def test_start_command(test_app, bot, update, context):
    with test_app.app_context():
        # Test start command with new user
        await bot.start(update, context)

        # Verify user creation
        user = User.query.filter_by(telegram_id=update.effective_user.id).first()
        assert user is not None
        assert user.username == "test_user"

        # Verify response
        update.message.reply_text.assert_called_once()
        call_args = update.message.reply_text.call_args
        text = call_args[0][0] if call_args[0] else call_args[1].get('text', '')
        assert "Добро пожаловать" in text

@pytest.mark.asyncio
async def test_show_catalog(test_app, bot, update, context):
    with test_app.app_context():
        # Create test category
        category = Category(name="Test Category", description="Test Description")
        db.session.add(category)
        db.session.commit()

        # Setup mock callback query
        update.callback_query = MagicMock()
        update.callback_query.from_user = update.effective_user

        # Mock product service to return our test category
        with patch.object(bot.product_service, 'get_categories', return_value=[category]):
            await bot.show_catalog(update, context)

            # Verify response
            update.callback_query.edit_message_text.assert_called_once()
            call_args = update.callback_query.edit_message_text.call_args
            text = call_args[0][0] if call_args[0] else call_args[1].get('text', '')
            assert "Выберите категорию" in text

@pytest.mark.asyncio
async def test_show_category_products(test_app, bot, update, context):
    with test_app.app_context():
        # Create test category and product
        category = Category(name="Test Category", description="Test Description")
        db.session.add(category)
        db.session.commit()

        product = Product(
            name="Test Product",
            description="Test Description",
            price=9.99,
            category_id=category.id,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        db.session.commit()

        # Setup mock callback query
        update.callback_query = MagicMock()
        update.callback_query.from_user = update.effective_user

        # Setup user state
        user_state = bot.get_user_state(update.effective_user.id)
        user_state.update('category', category_id=category.id, page=1)

        # Mock product service to return our test product
        with patch.object(bot.product_service, 'get_products_by_category', return_value=[product]):
            await bot.show_category_products(update, context, category.id)

            # Verify response
            update.callback_query.edit_message_text.assert_called_once()
            call_args = update.callback_query.edit_message_text.call_args
            message_text = call_args[0][0] if call_args[0] else call_args[1].get('text', '')

            # Check all required elements in the message
            assert "📦 Доступные товары" in message_text
            assert product.name in message_text
            assert f"${product.price:.2f}" in message_text
            assert "(стр. 1/1)" in message_text

@pytest.mark.parametrize("query_data", [
    'catalog',
    'orders',
    'profile',
    'support'
])
@pytest.mark.asyncio
async def test_handle_callback(test_app, bot, update, context, query_data):
    with test_app.app_context():
        update.callback_query = MagicMock()
        update.callback_query.data = query_data
        update.callback_query.from_user = update.effective_user

        # Mock rate limiter and relevant service methods
        with patch.object(bot.rate_limiter, 'check_limit', return_value=True), \
             patch.multiple(bot,
                show_catalog=MagicMock(),
                show_orders=MagicMock(),
                show_profile=MagicMock(),
                show_support=MagicMock()):
            await bot.handle_callback(update, context)

            # Verify the correct method was called
            if query_data == 'catalog':
                bot.show_catalog.assert_called_once_with(update, context)
            elif query_data == 'orders':
                bot.show_orders.assert_called_once_with(update, context)
            elif query_data == 'profile':
                bot.show_profile.assert_called_once_with(update, context)
            elif query_data == 'support':
                bot.show_support.assert_called_once_with(update, context)

@pytest.mark.asyncio
async def test_rate_limiting(test_app, bot, update, context):
    with test_app.app_context():
        # Setup message mock with text
        update.message.text = "Test message"
        update.effective_user.id = 12345

        # Setup user state
        user_state = bot.get_user_state(update.effective_user.id)
        user_state.update('main_menu')

        # Mock rate limiter to simulate rate limit exceeded
        with patch.object(bot.rate_limiter, 'check_limit', return_value=False), \
             patch.object(bot.rate_limiter, 'get_remaining_attempts', return_value=(0, 30)):
            await bot.handle_message(update, context)

            # Verify rate limit message
            update.message.reply_text.assert_called_once()
            call_args = update.message.reply_text.call_args
            text = call_args[0][0] if call_args[0] else call_args[1].get('text', '')

            # Check error message content
            assert "⚠️" in text  # Contains warning emoji
            assert "Слишком много сообщений" in text  # Contains main error message
            assert "Пожалуйста" in text  # Contains polite request

            # Check reply markup exists with return to menu button
            reply_markup = call_args[1].get('reply_markup')
            assert reply_markup is not None
            keyboard = reply_markup.inline_keyboard
            assert any('меню' in str(button) for row in keyboard for button in row)

@pytest.mark.asyncio
async def test_admin_access(test_app, bot, update, context):
    with test_app.app_context():
        # Mock admin check to return True
        with patch.object(bot.admin_service, 'is_admin', return_value=True):
            await bot.start(update, context)

            # Verify admin panel button presence
            args = update.message.reply_text.call_args
            reply_markup = args[1]['reply_markup']
            assert any('Админ панель' in str(button) for row in reply_markup.inline_keyboard for button in row)

@pytest.mark.asyncio
async def test_error_handling(test_app, bot, update, context):
    with test_app.app_context():
        # Setup mock callback query
        update.callback_query = MagicMock()
        update.callback_query.from_user = update.effective_user

        # Test error handling with service exception
        with patch.object(bot.product_service, 'get_categories', side_effect=Exception("Test error")):
            await bot.show_catalog(update, context)

            # Verify error response
            error_calls = [call[0][0] for call in update.callback_query.answer.call_args_list]
            assert any("Не удалось загрузить каталог" in call for call in error_calls)