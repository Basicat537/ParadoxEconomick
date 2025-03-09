import pytest
from unittest.mock import MagicMock, patch
from telegram import Update, User as TelegramUser
from telegram.ext import ContextTypes
from bot import TelegramBot
from models import User, Category, Product, Order
from config import Config

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
    return update

@pytest.fixture
def context():
    return MagicMock(spec=ContextTypes.DEFAULT_TYPE)

async def test_start_command(bot, update, context):
    # Test start command with new user
    await bot.start(update, context)
    
    # Verify user creation
    user = User.query.filter_by(telegram_id=update.effective_user.id).first()
    assert user is not None
    assert user.username == "test_user"
    
    # Verify response
    update.message.reply_text.assert_called_once()
    args = update.message.reply_text.call_args
    assert "Welcome" in args[0][0]

async def test_show_catalog(bot, update, context):
    # Create test categories
    category = Category(name="Test Category", description="Test Description")
    db.session.add(category)
    db.session.commit()
    
    update.callback_query = MagicMock()
    
    await bot.show_catalog(update, context)
    
    # Verify response
    update.callback_query.edit_message_text.assert_called_once()
    args = update.callback_query.edit_message_text.call_args
    assert "Choose a category" in args[1]['text']

async def test_show_products(bot, update, context):
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
    
    update.callback_query = MagicMock()
    
    await bot.show_products(update, context, category.id)
    
    # Verify response
    update.callback_query.edit_message_text.assert_called_once()
    args = update.callback_query.edit_message_text.call_args
    assert "Test Product" in args[1]['text']

@pytest.mark.parametrize("query_data", [
    'catalog',
    'orders',
    'profile',
    'support'
])
async def test_handle_callback(bot, update, context, query_data):
    update.callback_query = MagicMock()
    update.callback_query.data = query_data
    
    with patch.object(bot, f'show_{query_data}') as mock_method:
        await bot.handle_callback(update, context)
        mock_method.assert_called_once_with(update, context)

async def test_rate_limiting(bot, update, context):
    # Test rate limiting
    for _ in range(Config.RATE_LIMIT_MESSAGES + 1):
        await bot.handle_message(update, context)
    
    # Verify rate limit message
    update.message.reply_text.assert_called_with(
        "Too many requests. Please try again later."
    )

async def test_admin_access(bot, update, context):
    # Test admin access
    update.effective_user.username = Config.ADMIN_USERNAMES[0]
    
    await bot.start(update, context)
    
    # Verify admin panel button presence
    args = update.message.reply_text.call_args
    reply_markup = args[1]['reply_markup']
    assert any('Admin Panel' in str(button) for row in reply_markup.inline_keyboard for button in row)

async def test_error_handling(bot, update, context):
    # Test error handling
    with patch.object(bot.product_service, 'get_categories', side_effect=Exception("Test error")):
        await bot.show_catalog(update, context)
        
        update.callback_query.answer.assert_called_with(
            "Failed to load catalog. Please try again."
        )
