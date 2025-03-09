import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, filters, ContextTypes
)
from config import Config
from services.product_service import ProductService
from services.user_service import UserService
from services.order_service import OrderService
from services.admin_service import AdminService
from utils.rate_limiter import RateLimiter
from utils.validators import validate_input
from utils.security import check_user_access

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=getattr(logging, Config.LOG_LEVEL)
)
logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self):
        # Initialize services
        try:
            self.product_service = ProductService()
            self.user_service = UserService()
            self.order_service = OrderService()
            self.admin_service = AdminService()
            self.rate_limiter = RateLimiter()

            # Validate required configuration
            Config.check_required_vars()
            logger.info("Bot initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize bot: {str(e)}")
            raise

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            user = update.effective_user
            if not self.rate_limiter.check_limit(user.id):
                await update.message.reply_text("Слишком много запросов. Пожалуйста, попробуйте позже.")
                return

            await self.user_service.create_user_if_not_exists(user)
            logger.info(f"User {user.id} started the bot")

            keyboard = [
                [InlineKeyboardButton("🛍 Каталог", callback_data='catalog'),
                 InlineKeyboardButton("🛒 Мои заказы", callback_data='orders')],
                [InlineKeyboardButton("👤 Профиль", callback_data='profile'),
                 InlineKeyboardButton("❓ Поддержка", callback_data='support')]
            ]

            if await self.admin_service.is_admin(user.id):
                keyboard.append([InlineKeyboardButton("⚙️ Админ панель", callback_data='admin')])

            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.message.reply_text(
                f"Добро пожаловать в наш магазин цифровых товаров, {user.first_name}!",
                reply_markup=reply_markup
            )
        except Exception as e:
            logger.error(f"Error in start command: {str(e)}")
            await update.message.reply_text("Произошла ошибка. Пожалуйста, попробуйте позже.")

    async def show_catalog(self, update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        try:
            categories = await self.product_service.get_categories()
            keyboard = []
            for category in categories:
                keyboard.append([InlineKeyboardButton(
                    category.name, callback_data=f'category_{category.id}'
                )])
            keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data='start')])

            await query.edit_message_text(
                "Выберите категорию:",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Error showing catalog: {str(e)}")
            await query.answer("Не удалось загрузить каталог. Пожалуйста, попробуйте позже.")

    async def show_products(self, update, context: ContextTypes.DEFAULT_TYPE, category_id: int):
        query = update.callback_query
        try:
            products = await self.product_service.get_products_by_category(category_id)
            keyboard = []
            for product in products:
                keyboard.append([InlineKeyboardButton(
                    f"{product.name} - ${product.price}",
                    callback_data=f'product_{product.id}'
                )])
            keyboard.append([InlineKeyboardButton("🔙 Назад к категориям", callback_data='catalog')])

            await query.edit_message_text(
                "Доступные товары:",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Error showing products: {str(e)}")
            await query.answer("Не удалось загрузить товары. Пожалуйста, попробуйте позже.")

    async def show_product_details(self, update, context: ContextTypes.DEFAULT_TYPE, product_id: int):
        query = update.callback_query
        try:
            product = await self.product_service.get_product(product_id)
            keyboard = [
                [InlineKeyboardButton("💰 Купить", callback_data=f'buy_{product_id}')],
                [InlineKeyboardButton("🔙 Назад", callback_data=f'category_{product.category_id}')]
            ]

            text = f"""
{product.name}

📝 Описание: {product.description}
💵 Цена: ${product.price}
            """

            await query.edit_message_text(
                text,
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Error showing product details: {str(e)}")
            await query.answer("Не удалось загрузить информацию о товаре. Пожалуйста, попробуйте позже.")

    async def handle_callback(self, update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        user = query.from_user

        try:
            if not self.rate_limiter.check_limit(user.id):
                await query.answer("Слишком много запросов. Пожалуйста, попробуйте позже.")
                return

            data = query.data

            if data == 'catalog':
                await self.show_catalog(update, context)
            elif data.startswith('category_'):
                category_id = int(data.split('_')[1])
                await self.show_products(update, context, category_id)
            elif data.startswith('product_'):
                product_id = int(data.split('_')[1])
                await self.show_product_details(update, context, product_id)
            elif data == 'orders':
                await self.show_orders(update, context)
            elif data == 'profile':
                await self.show_profile(update, context)
            elif data == 'support':
                await self.show_support(update, context)
            elif data == 'admin' and await self.admin_service.is_admin(user.id):
                await self.show_admin_panel(update, context)

        except Exception as e:
            logger.error(f"Error handling callback: {str(e)}")
            await query.answer("Произошла ошибка. Пожалуйста, попробуйте позже.")

    async def show_orders(self, update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        try:
            orders = await self.order_service.get_user_orders(query.from_user.id)
            if not orders:
                keyboard = [[InlineKeyboardButton("🔙 Главное меню", callback_data='start')]]
                await query.edit_message_text(
                    "У вас пока нет заказов.",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )
                return

            text = "Ваши заказы:\n\n"
            keyboard = []

            for order in orders:
                text += f"Заказ #{order.id}\n"
                text += f"Товар: {order.product.name}\n"
                text += f"Статус: {order.status}\n"
                text += f"Дата: {order.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
                keyboard.append([InlineKeyboardButton(
                    f"Детали заказа #{order.id}",
                    callback_data=f'order_{order.id}'
                )])

            keyboard.append([InlineKeyboardButton("🔙 Главное меню", callback_data='start')])
            await query.edit_message_text(
                text,
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Error showing orders: {str(e)}")
            await query.answer("Не удалось загрузить заказы. Пожалуйста, попробуйте позже.")

    async def show_profile(self, update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        try:
            profile = await self.user_service.get_user_profile(query.from_user.id)
            if not profile:
                await query.answer("Профиль не найден.")
                return

            text = f"""
👤 Профиль

Username: @{profile['username']}
Дата регистрации: {profile['created_at'].strftime('%d.%m.%Y')}
Количество заказов: {profile['orders_count']}
            """

            keyboard = [[InlineKeyboardButton("🔙 Главное меню", callback_data='start')]]
            await query.edit_message_text(
                text,
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Error showing profile: {str(e)}")
            await query.answer("Не удалось загрузить профиль. Пожалуйста, попробуйте позже.")

    async def show_support(self, update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        keyboard = [
            [InlineKeyboardButton("📝 Создать тикет", callback_data='create_ticket')],
            [InlineKeyboardButton("📋 Мои тикеты", callback_data='my_tickets')],
            [InlineKeyboardButton("🔙 Главное меню", callback_data='start')]
        ]

        await query.edit_message_text(
            "Служба поддержки\n\nВыберите действие:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

    async def show_admin_panel(self, update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        try:
            if not await self.admin_service.is_admin(query.from_user.id):
                await query.answer("Доступ запрещен")
                return

            stats = await self.admin_service.get_statistics()
            text = f"""
⚙️ Админ панель

📊 Статистика:
👥 Пользователей: {stats['total_users']}
📦 Всего заказов: {stats['total_orders']}
✅ Выполнено заказов: {stats['completed_orders']}
❓ Открытых тикетов: {stats['pending_tickets']}
🛍 Активных товаров: {stats['active_products']}
            """

            keyboard = [
                [InlineKeyboardButton("📦 Управление товарами", callback_data='admin_products'),
                 InlineKeyboardButton("👥 Пользователи", callback_data='admin_users')],
                [InlineKeyboardButton("🎫 Тикеты", callback_data='admin_tickets'),
                 InlineKeyboardButton("💰 Финансы", callback_data='admin_finance')],
                [InlineKeyboardButton("🔙 Главное меню", callback_data='start')]
            ]

            await query.edit_message_text(
                text,
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            logger.error(f"Error showing admin panel: {str(e)}")
            await query.answer("Не удалось загрузить админ панель. Пожалуйста, попробуйте позже.")

    @validate_input
    async def handle_message(self, update, context: ContextTypes.DEFAULT_TYPE):
        try:
            if not self.rate_limiter.check_limit(update.effective_user.id):
                await update.message.reply_text("Слишком много сообщений. Пожалуйста, подождите.")
                return

            # Здесь можно добавить обработку текстовых сообщений
            await update.message.reply_text(
                "Пожалуйста, используйте меню для навигации.",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("🔄 Открыть меню", callback_data='start')
                ]])
            )
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await update.message.reply_text("Произошла ошибка. Пожалуйста, попробуйте позже.")

    def run(self):
        """Run the bot"""
        try:
            # Create and configure the application
            app = Application.builder().token(Config.BOT_TOKEN).build()

            # Add handlers
            app.add_handler(CommandHandler("start", self.start))
            app.add_handler(CallbackQueryHandler(self.handle_callback))
            app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))

            # Start the bot
            logger.info("Bot started")
            app.run_polling(allowed_updates=Update.ALL_TYPES)
        except Exception as e:
            logger.error(f"Failed to start bot: {str(e)}")
            raise

def main():
    """Main function to run the bot"""
    try:
        bot = TelegramBot()
        bot.run()
    except Exception as e:
        logger.critical(f"Critical error: {str(e)}")
        raise

if __name__ == '__main__':
    main()