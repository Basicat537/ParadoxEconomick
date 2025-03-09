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
from utils.logger import BotLogger
from utils.error_handler import handle_errors, db_session_decorator
from app import app
from datetime import datetime, timedelta

logger = BotLogger.get_logger()

class UserState:
    """Class to manage user conversation state"""
    def __init__(self):
        self.state = 'start'
        self.data = {}
        self.last_command = None
        self.last_interaction = datetime.utcnow()

    def update(self, new_state, **kwargs):
        self.state = new_state
        self.data.update(kwargs)
        self.last_interaction = datetime.utcnow()

    def is_expired(self, timeout_minutes=30):
        return datetime.utcnow() - self.last_interaction > timedelta(minutes=timeout_minutes)

class TelegramBot:
    def __init__(self):
        try:
            # Initialize services
            self.product_service = ProductService()
            self.user_service = UserService()
            self.order_service = OrderService()
            self.admin_service = AdminService()
            self.rate_limiter = RateLimiter()
            self.user_states = {}

            # Validate required configuration
            Config.check_required_vars()
            logger.info("Bot initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize bot: {str(e)}")
            raise

    def get_user_state(self, user_id: int) -> UserState:
        """Get or create user state"""
        if user_id not in self.user_states or self.user_states[user_id].is_expired():
            self.user_states[user_id] = UserState()
        return self.user_states[user_id]

    async def handle_error(self, update: Update, error_message: str):
        """Enhanced error handling with detailed feedback"""
        try:
            user_id = update.effective_user.id

            # Check if this is a rate limit error
            remaining, wait_time = self.rate_limiter.get_remaining_attempts(user_id)
            if wait_time > 0:
                error_message = (
                    f"⚠️ {error_message}\n"
                    f"Пожалуйста, подождите {wait_time} секунд перед следующей попыткой."
                )

            if update.callback_query:
                await update.callback_query.answer(
                    error_message,
                    show_alert=True
                )
            else:
                keyboard = [[
                    InlineKeyboardButton("🔄 Главное меню", callback_data='start')
                ]]
                await update.message.reply_text(
                    f"{error_message}\n\nИспользуйте меню для навигации:",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )

            logger.warning(
                f"Error handled for user {user_id}: {error_message} "
                f"(Wait time: {wait_time}s)"
            )
        except Exception as e:
            logger.error(f"Error in error handler: {str(e)}")

    @handle_errors
    @db_session_decorator
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Enhanced start command with better user feedback"""
        with app.app_context():
            try:
                user = update.effective_user
                BotLogger.log_request(update, context)

                # Check rate limit with detailed feedback
                if not self.rate_limiter.check_limit(user.id):
                    remaining, wait_time = self.rate_limiter.get_remaining_attempts(user.id)
                    await self.handle_error(
                        update,
                        f"⚠️ Слишком много запросов. Осталось попыток: {remaining}"
                    )
                    return

                # Reset user state
                user_state = self.get_user_state(user.id)
                user_state.update('main_menu')

                # Create or update user
                await self.user_service.create_user_if_not_exists(user)
                logger.info(f"User {user.id} started the bot")

                # Build dynamic keyboard with help button
                keyboard = [
                    [
                        InlineKeyboardButton("🛍 Каталог", callback_data='catalog'),
                        InlineKeyboardButton("🛒 Мои заказы", callback_data='orders')
                    ],
                    [
                        InlineKeyboardButton("👤 Профиль", callback_data='profile'),
                        InlineKeyboardButton("❓ Поддержка", callback_data='support')
                    ],
                    [
                        InlineKeyboardButton("📖 Помощь", callback_data='help')
                    ]
                ]

                if await self.admin_service.is_admin(user.id):
                    keyboard.insert(-1, [
                        InlineKeyboardButton("⚙️ Админ панель", callback_data='admin')
                    ])

                reply_markup = InlineKeyboardMarkup(keyboard)
                welcome_text = (
                    f"👋 Добро пожаловать в наш магазин цифровых товаров, {user.first_name}!\n\n"
                    "🔹 В каталоге вы найдете все доступные товары\n"
                    "🔹 В разделе заказов - историю ваших покупок\n"
                    "🔹 В профиле - ваши персональные данные\n"
                    "🔹 В поддержке - помощь по любым вопросам\n\n"
                    "Выберите нужный раздел в меню ниже:"
                )

                await update.message.reply_text(
                    welcome_text,
                    reply_markup=reply_markup
                )

            except Exception as e:
                logger.error(f"Error in start command: {str(e)}")
                await self.handle_error(update, "Произошла ошибка. Попробуйте позже.")

    @handle_errors
    @db_session_decorator
    async def show_catalog(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Enhanced catalog display with error recovery"""
        with app.app_context():
            query = update.callback_query
            user_state = self.get_user_state(query.from_user.id)

            try:
                categories = await self.product_service.get_categories()
                keyboard = []

                # Group categories in pairs for better layout
                for i in range(0, len(categories), 2):
                    row = [InlineKeyboardButton(
                        categories[i].name,
                        callback_data=f'category_{categories[i].id}'
                    )]
                    if i + 1 < len(categories):
                        row.append(InlineKeyboardButton(
                            categories[i+1].name,
                            callback_data=f'category_{categories[i+1].id}'
                        ))
                    keyboard.append(row)

                keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data='start')])
                user_state.update('catalog')

                await query.edit_message_text(
                    "📚 Выберите категорию:",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )
            except Exception as e:
                logger.error(f"Error showing catalog: {str(e)}")
                await self.handle_error(update, "Не удалось загрузить каталог")

    @handle_errors
    @db_session_decorator
    async def show_category_products(self, update: Update, context: ContextTypes.DEFAULT_TYPE, category_id: int):
        """Enhanced product listing with pagination"""
        with app.app_context():
            query = update.callback_query
            user_state = self.get_user_state(query.from_user.id)

            try:
                products = await self.product_service.get_products_by_category(category_id)

                if not products:
                    await query.edit_message_text(
                        "В этой категории пока нет товаров.",
                        reply_markup=InlineKeyboardMarkup([[
                            InlineKeyboardButton("🔙 Назад к категориям", callback_data='catalog')
                        ]])
                    )
                    return

                # Paginate products
                page = int(user_state.data.get('page', 1))
                per_page = 5
                start_idx = (page - 1) * per_page
                end_idx = start_idx + per_page
                current_products = products[start_idx:end_idx]

                keyboard = []
                for product in current_products:
                    keyboard.append([InlineKeyboardButton(
                        f"{product.name} - ${product.price}",
                        callback_data=f'product_{product.id}'
                    )])

                # Add pagination controls
                nav_buttons = []
                if page > 1:
                    nav_buttons.append(InlineKeyboardButton(
                        "⬅️ Назад",
                        callback_data=f'page_{page-1}'
                    ))
                if end_idx < len(products):
                    nav_buttons.append(InlineKeyboardButton(
                        "➡️ Вперед",
                        callback_data=f'page_{page+1}'
                    ))
                if nav_buttons:
                    keyboard.append(nav_buttons)

                keyboard.append([InlineKeyboardButton(
                    "🔙 Назад к категориям",
                    callback_data='catalog'
                )])

                user_state.update('category', category_id=category_id, page=page)

                await query.edit_message_text(
                    f"📦 Доступные товары (стр. {page}/{(len(products)-1)//per_page + 1}):",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )
            except Exception as e:
                logger.error(f"Error showing products: {str(e)}")
                await self.handle_error(update, "Не удалось загрузить товары")

    @handle_errors
    @db_session_decorator
    async def show_product_details(self, update: Update, context: ContextTypes.DEFAULT_TYPE, product_id: int):
        """Enhanced product details with rich formatting"""
        with app.app_context():
            query = update.callback_query
            user_state = self.get_user_state(query.from_user.id)

            try:
                product = await self.product_service.get_product(product_id)
                if not product:
                    await self.handle_error(update, "Товар не найден")
                    return

                keyboard = [
                    [InlineKeyboardButton("💰 Купить", callback_data=f'buy_{product_id}')],
                    [InlineKeyboardButton(
                        "🔙 Назад к товарам",
                        callback_data=f'category_{product.category_id}'
                    )]
                ]

                text = (
                    f"🏷 *{product.name}*\n\n"
                    f"📝 *Описание:*\n{product.description}\n\n"
                    f"💵 *Цена:* ${product.price:.2f}\n"
                    f"📦 *Категория:* {product.category.name}\n"
                )

                user_state.update('product', product_id=product_id)

                await query.edit_message_text(
                    text,
                    reply_markup=InlineKeyboardMarkup(keyboard),
                    parse_mode='Markdown'
                )
            except Exception as e:
                logger.error(f"Error showing product details: {str(e)}")
                await self.handle_error(update, "Не удалось загрузить информацию о товаре")

    @handle_errors
    @db_session_decorator
    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Enhanced callback handling with better state management and feedback"""
        with app.app_context():
            query = update.callback_query
            user = query.from_user
            user_state = self.get_user_state(user.id)

            try:
                # Rate limit check with detailed feedback
                if not self.rate_limiter.check_limit(user.id):
                    remaining, wait_time = self.rate_limiter.get_remaining_attempts(user.id)
                    await query.answer(
                        f"⚠️ Слишком много запросов. Подождите {wait_time} секунд.",
                        show_alert=True
                    )
                    return

                data = query.data

                # Handle help command
                if data == 'help':
                    help_text = (
                        "📖 *Помощь по использованию бота*\n\n"
                        "🔹 Для просмотра товаров используйте раздел *Каталог*\n"
                        "🔹 История покупок доступна в разделе *Мои заказы*\n"
                        "🔹 Ваши данные можно посмотреть в *Профиле*\n"
                        "🔹 Если возникли вопросы - обратитесь в *Поддержку*\n\n"
                        "Для возврата в главное меню нажмите кнопку ниже:"
                    )
                    keyboard = [[InlineKeyboardButton("🔙 Главное меню", callback_data='start')]]
                    await query.edit_message_text(
                        help_text,
                        reply_markup=InlineKeyboardMarkup(keyboard),
                        parse_mode='Markdown'
                    )
                    return

                # Handle pagination
                if data.startswith('page_'):
                    page = int(data.split('_')[1])
                    user_state.data['page'] = page
                    await self.show_category_products(
                        update,
                        context,
                        user_state.data['category_id']
                    )
                    return

                # Handle navigation timeouts
                if user_state.is_expired():
                    await query.answer(
                        "⚠️ Сессия истекла. Пожалуйста, начните сначала.",
                        show_alert=True
                    )
                    user_state.update('start')
                    await self.start(update, context)
                    return

                # Handle main navigation with state tracking
                prev_state = user_state.state
                if data == 'catalog':
                    user_state.update('catalog')
                    await self.show_catalog(update, context)
                elif data.startswith('category_'):
                    category_id = int(data.split('_')[1])
                    user_state.update('category', category_id=category_id)
                    await self.show_category_products(update, context, category_id)
                elif data.startswith('product_'):
                    product_id = int(data.split('_')[1])
                    user_state.update('product', product_id=product_id)
                    await self.show_product_details(update, context, product_id)
                elif data == 'orders':
                    user_state.update('orders')
                    await self.show_orders(update, context)
                elif data == 'profile':
                    user_state.update('profile')
                    await self.show_profile(update, context)
                elif data == 'support':
                    user_state.update('support')
                    await self.show_support(update, context)
                elif data == 'admin' and await self.admin_service.is_admin(user.id):
                    user_state.update('admin')
                    await self.show_admin_panel(update, context)
                elif data == 'start':
                    user_state.update('main_menu')
                    keyboard = self.get_main_menu_keyboard(user.id)
                    await query.edit_message_text(
                        "Главное меню:",
                        reply_markup=keyboard
                    )
                else:
                    logger.warning(f"Unknown callback data: {data}")
                    await query.answer(
                        "⚠️ Неизвестная команда",
                        show_alert=True
                    )
                    return

                # Log navigation for analytics
                logger.info(
                    f"User {user.id} navigated from {prev_state} to {user_state.state}"
                )

            except Exception as e:
                logger.error(f"Error handling callback: {str(e)}")
                await self.handle_error(update, "Произошла ошибка при обработке команды")

    def get_main_menu_keyboard(self, user_id: int) -> InlineKeyboardMarkup:
        """Generate main menu keyboard"""
        keyboard = [
            [
                InlineKeyboardButton("🛍 Каталог", callback_data='catalog'),
                InlineKeyboardButton("🛒 Мои заказы", callback_data='orders')
            ],
            [
                InlineKeyboardButton("👤 Профиль", callback_data='profile'),
                InlineKeyboardButton("❓ Поддержка", callback_data='support')
            ],
            [
                InlineKeyboardButton("📖 Помощь", callback_data='help')
            ]
        ]

        if self.admin_service.is_admin(user_id):
            keyboard.insert(-1, [
                InlineKeyboardButton("⚙️ Админ панель", callback_data='admin')
            ])

        return InlineKeyboardMarkup(keyboard)

    @validate_input
    @handle_errors
    @db_session_decorator
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Enhanced message handling with context awareness"""
        with app.app_context():
            try:
                user = update.effective_user
                user_state = self.get_user_state(user.id)

                if not self.rate_limiter.check_limit(user.id):
                    await update.message.reply_text(
                        "⚠️ Слишком много сообщений. Пожалуйста, подождите."
                    )
                    return

                # Handle different states
                if user_state.state == 'support_ticket':
                    # Handle support ticket creation
                    await self.handle_support_message(update, context, user_state)
                else:
                    # Default response
                    await update.message.reply_text(
                        "Пожалуйста, используйте меню для навигации:",
                        reply_markup=self.get_main_menu_keyboard(user.id)
                    )

            except Exception as e:
                logger.error(f"Error handling message: {str(e)}")
                await self.handle_error(update, "Произошла ошибка")

    async def handle_support_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE, user_state: UserState):
        """Handle support ticket messages"""
        message = update.message.text

        if len(message) < 10:
            await update.message.reply_text(
                "❌ Сообщение слишком короткое. Пожалуйста, опишите вашу проблему подробнее."
            )
            return

        try:
            # Assuming support_service is defined elsewhere
            ticket = await self.support_service.create_ticket(
                user_id=update.effective_user.id,
                message=message
            )

            user_state.update('main_menu')
            await update.message.reply_text(
                "✅ Ваше обращение принято! Мы ответим вам в ближайшее время.",
                reply_markup=self.get_main_menu_keyboard(update.effective_user.id)
            )

        except Exception as e:
            logger.error(f"Error creating support ticket: {str(e)}")
            await self.handle_error(update, "Не удалось создать обращение")


    @handle_errors
    @db_session_decorator
    async def show_orders(self, update, context: ContextTypes.DEFAULT_TYPE):
        with app.app_context():
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

    @handle_errors
    @db_session_decorator
    async def show_profile(self, update, context: ContextTypes.DEFAULT_TYPE):
        with app.app_context():
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

    @handle_errors
    @db_session_decorator
    async def show_support(self, update, context: ContextTypes.DEFAULT_TYPE):
        with app.app_context():
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

    @handle_errors
    @db_session_decorator
    async def show_admin_panel(self, update, context: ContextTypes.DEFAULT_TYPE):
        with app.app_context():
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

    async def show_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Shows help information to the user."""
        try:
            query = update.callback_query
            help_text = """
            **Помощь по боту:**

            * `/start` - Начать работу с ботом
            * Каталог - Просмотр доступных товаров
            * Мои заказы - Просмотр истории заказов
            * Профиль - Просмотр информации о профиле
            * Поддержка - Создание и просмотр тикетов поддержки
            * Админ панель (только для администраторов) - Доступ к панели управления
            """
            keyboard = [[InlineKeyboardButton("🔙 Главное меню", callback_data='start')]]
            await query.edit_message_text(
                text=help_text,
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"Error showing help: {str(e)}")
            await self.handle_error(update, "Не удалось загрузить справку")

    def run(self):
        """Run the bot with enhanced error handling"""
        try:
            # Create and configure the application
            app = Application.builder().token(Config.BOT_TOKEN).build()

            # Add handlers
            app.add_handler(CommandHandler("start", self.start))
            app.add_handler(CallbackQueryHandler(self.handle_callback))
            app.add_handler(MessageHandler(
                filters.TEXT & ~filters.COMMAND,
                self.handle_message
            ))

            # Start the bot
            logger.info("Bot started")
            app.run_polling(
                allowed_updates=Update.ALL_TYPES,
                drop_pending_updates=True
            )
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