import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export function setupBot() {
  // Команда помощи
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
      "🤖 *Доступные команды:*\n\n" +
      "📝 */start* - Начать работу с ботом\n" +
      "📋 */register* - Инструкции по регистрации\n" +
      "👤 */admin* - Доступ к админ-панели (только для администраторов)\n" +
      "💬 */support <сообщение>* - Создать тикет в поддержку\n\n" +
      "🛍 *Меню покупателя:*\n" +
      "• Каталог товаров\n" +
      "• Мои заказы\n" +
      "• Поддержка\n" +
      "• Профиль\n\n" +
      "❓ Используйте кнопки меню для навигации",
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "👋 *Добро пожаловать в магазин цифровых товаров!*\n\n" +
        "Для начала работы с ботом вам нужно:\n\n" +
        "1️⃣ Зарегистрироваться на нашем сайте\n" +
        "2️⃣ Указать ваш Telegram ID при регистрации:\n" +
        "`" + chatId + "`\n\n" +
        "Используйте /register для получения подробных инструкций по регистрации.\n" +
        "Используйте /help для просмотра всех доступных команд.",
        { 
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [
              [{ text: '📝 Инструкции по регистрации' }],
              [{ text: '❓ Помощь' }]
            ],
            resize_keyboard: true
          }
        }
      );
      return;
    }

    const keyboard = {
      keyboard: [
        [{ text: '🛍 Каталог' }, { text: '🛒 Мои заказы' }],
        [{ text: '💬 Поддержка' }, { text: '👤 Профиль' }],
        [{ text: '❓ Помощь' }]
      ],
      resize_keyboard: true
    };

    bot.sendMessage(chatId, 
      `👋 *С возвращением, ${user.username}!*\n\n` +
      "Выберите нужный пункт меню:\n\n" +
      "🛍 *Каталог* - Просмотр и покупка товаров\n" +
      "🛒 *Мои заказы* - История и статус заказов\n" +
      "💬 *Поддержка* - Связь с поддержкой\n" +
      "👤 *Профиль* - Информация о профиле",
      { 
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );
  });

  bot.onText(/👤 Профиль/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "❌ *Доступ запрещен*\n\n" +
        "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const orders = await storage.getUserOrders(user.id);
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const activeOrders = orders.filter(o => ['pending', 'paid'].includes(o.status)).length;

    bot.sendMessage(chatId,
      "👤 *Профиль пользователя*\n\n" +
      `*Имя пользователя:* ${user.username}\n` +
      `*ID Telegram:* \`${user.telegramId}\`\n` +
      `*Дата регистрации:* ${new Date(user.createdAt).toLocaleDateString()}\n\n` +
      "📊 *Статистика:*\n" +
      `• Всего заказов: ${orders.length}\n` +
      `• Выполнено: ${completedOrders}\n` +
      `• Активных: ${activeOrders}\n\n` +
      "💡 *Действия:*\n" +
      "• Используйте 🛍 Каталог для покупок\n" +
      "• Используйте 🛒 Мои заказы для просмотра заказов\n" +
      "• Используйте 💬 Поддержка для связи с нами",
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/📝 Инструкции по регистрации|\/register/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
      "📝 *Инструкция по регистрации:*\n\n" +
      "1️⃣ Перейдите на сайт:\n" +
      "http://localhost:5000/auth\n\n" +
      "2️⃣ Нажмите кнопку 'Регистрация'\n\n" +
      "3️⃣ Заполните форму:\n" +
      "• Придумайте имя пользователя\n" +
      "• Задайте надежный пароль\n" +
      "• В поле Telegram ID введите:\n" +
      "`" + chatId + "`\n\n" +
      "4️⃣ После успешной регистрации вернитесь в бот и напишите /start",
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "❌ *Доступ запрещен*\n\n" +
        "Сначала необходимо зарегистрироваться.\n" +
        "Используйте /register для получения инструкций.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (!user.isAdmin) {
      bot.sendMessage(chatId, 
        "❌ *Доступ запрещен*\n\n" +
        "У вас нет прав администратора.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    bot.sendMessage(chatId,
      "👨‍💼 *Админ-панель*\n\n" +
      "🌐 Доступ по адресу:\n" +
      "http://localhost:5000/admin/products\n\n" +
      "*Возможности панели:*\n" +
      "✓ Управление товарами\n" +
      "✓ Управление категориями\n" +
      "✓ Просмотр заказов\n" +
      "✓ Работа с тикетами\n\n" +
      "💡 Используйте веб-интерфейс для удобного управления магазином",
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/🛍 Каталог/, async (msg) => {
    const chatId = msg.chat.id;
    const categories = await storage.getCategories();

    if (categories.length === 0) {
      bot.sendMessage(chatId, 
        "😕 *Каталог пуст*\n\n" +
        "В данный момент нет доступных категорий товаров.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const keyboard = {
      inline_keyboard: categories.map(cat => [{
        text: `📁 ${cat.name}`,
        callback_data: `category_${cat.id}`
      }])
    };

    bot.sendMessage(chatId, 
      "🛍 *Каталог товаров*\n\n" +
      "Выберите интересующую категорию:",
      { 
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );
  });

  bot.on('callback_query', async (query) => {
    if (!query.data || !query.message) return;

    const chatId = query.message.chat.id;

    if (query.data.startsWith('category_')) {
      const categoryId = parseInt(query.data.split('_')[1]);
      const products = await storage.getProducts();
      const categoryProducts = products.filter(p => p.categoryId === categoryId);

      if (categoryProducts.length === 0) {
        bot.sendMessage(chatId,
          "😕 *Категория пуста*\n\n" +
          "В данной категории пока нет товаров.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const category = await storage.getCategory(categoryId);
      if (category) {
        bot.sendMessage(chatId,
          `📁 *${category.name}*\n\n` +
          `${category.description || 'Нет описания'}\n\n` +
          `Доступно товаров: ${categoryProducts.length}`,
          { parse_mode: "Markdown" }
        );
      }

      for (const product of categoryProducts) {
        const keyboard = {
          inline_keyboard: [[{
            text: `💳 Купить за $${(product.price / 100).toFixed(2)}`,
            callback_data: `buy_${product.id}`
          }]]
        };

        bot.sendMessage(chatId,
          `🏷 *${product.name}*\n\n` +
          `📝 ${product.description}\n\n` +
          `💰 Цена: $${(product.price / 100).toFixed(2)}\n` +
          `📦 В наличии: ${product.stock} шт.`,
          { 
            parse_mode: "Markdown",
            reply_markup: keyboard
          }
        );
      }
    }

    if (query.data.startsWith('buy_')) {
      const productId = parseInt(query.data.split('_')[1]);
      const product = await storage.getProduct(productId);

      if (!product) {
        bot.sendMessage(chatId, 
          "❌ *Ошибка*\n\n" +
          "Товар не найден или был удален.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      if (product.stock <= 0) {
        bot.sendMessage(chatId,
          "⚠️ *Товар временно недоступен*\n\n" +
          "К сожалению, данный товар закончился.\n" +
          "Попробуйте выбрать другой товар или вернуться позже.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Генерация инструкций по оплате
      bot.sendMessage(chatId,
        `🛒 *Оформление заказа*\n\n` +
        `Товар: ${product.name}\n` +
        `Сумма к оплате: $${(product.price / 100).toFixed(2)}\n\n` +
        `💳 *Способы оплаты:*\n` +
        `• USDT (TRC20): \`<адрес_кошелька>\`\n` +
        `• BTC: \`<адрес_кошелька>\`\n\n` +
        `📝 После оплаты отправьте ID транзакции в поддержку используя команду:\n` +
        `/support Оплата заказа ${product.name} - <ID транзакции>`,
        { parse_mode: "Markdown" }
      );

      // Отправка дополнительной информации об условиях
      bot.sendMessage(chatId,
        "ℹ️ *Важная информация:*\n\n" +
        "• Оплата обрабатывается автоматически\n" +
        "• Товар будет доставлен после подтверждения оплаты\n" +
        "• Среднее время обработки заказа: 5-15 минут\n" +
        "• При возникновении проблем обратитесь в поддержку\n\n" +
        "🔒 Мы гарантируем безопасность сделки и конфиденциальность ваших данных",
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.onText(/🛒 Мои заказы/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "❌ *Доступ запрещен*\n\n" +
        "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const orders = await storage.getUserOrders(user.id);

    if (orders.length === 0) {
      bot.sendMessage(chatId, 
        "📭 *История заказов пуста*\n\n" +
        "У вас пока нет заказов.\n" +
        "Используйте команду 🛍 Каталог для просмотра доступных товаров.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Сначала отправляем общую статистику
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    bot.sendMessage(chatId,
      "📊 *Статистика заказов*\n\n" +
      `Всего заказов: ${orders.length}\n` +
      `Общая сумма: $${(totalSpent / 100).toFixed(2)}\n\n` +
      "*Статусы заказов:*\n" +
      `⏳ Ожидают оплаты: ${statusCounts['pending'] || 0}\n` +
      `💰 Оплачены: ${statusCounts['paid'] || 0}\n` +
      `✅ Доставлены: ${statusCounts['delivered'] || 0}\n` +
      `❌ Отменены: ${statusCounts['cancelled'] || 0}`,
      { parse_mode: "Markdown" }
    );

    // Затем отправляем детали каждого заказа
    for (const order of orders) {
      const product = await storage.getProduct(order.productId);
      if (!product) continue;

      const statusEmoji = {
        pending: "⏳",
        paid: "💰",
        delivered: "✅",
        cancelled: "❌"
      }[order.status] || "❓";

      const formattedDate = new Date(order.createdAt).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      bot.sendMessage(chatId,
        `📦 *Заказ #${order.id}*\n\n` +
        `Товар: ${product.name}\n` +
        `Статус: ${statusEmoji} ${order.status}\n` +
        `Количество: ${order.quantity} шт.\n` +
        `Сумма: $${(order.totalPrice / 100).toFixed(2)}\n` +
        `Дата: ${formattedDate}\n\n` +
        (order.status === 'pending' ? 
          "💡 *Ожидается оплата*\nИспользуйте команду /support для отправки ID транзакции" : 
          ""),
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.onText(/💬 Поддержка/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "❌ *Доступ запрещен*\n\n" +
        "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const tickets = await storage.getUserTickets(user.id);
    const openTickets = tickets.filter(t => t.status === 'open').length;

    bot.sendMessage(chatId,
      "💬 *Техническая поддержка*\n\n" +
      `У вас ${openTickets} ${openTickets === 1 ? 'открытый тикет' : 'открытых тикетов'}\n\n` +
      "Чтобы создать новый тикет, отправьте сообщение в формате:\n" +
      "`/support <ваше сообщение>`\n\n" +
      "Примеры обращений:\n" +
      "• `/support Не получил товар после оплаты`\n" +
      "• `/support Проблема с активацией товара`\n" +
      "• `/support Вопрос по оплате`\n\n" +
      "⚡️ Среднее время ответа: 30 минут\n" +
      "🕒 Время работы поддержки: 24/7",
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/❓ Помощь/, (msg) => {
    bot.onText(/\/help/, msg);
  });

  bot.onText(/\/support (.+)/, async (msg, match) => {
    if (!match) return;

    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "❌ *Доступ запрещен*\n\n" +
        "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const ticket = await storage.createTicket({
      userId: user.id,
      subject: "Запрос в поддержку из Telegram",
      message: match[1],
      status: "open"
    });

    bot.sendMessage(chatId,
      `📨 *Тикет создан*\n\n` +
      `Номер тикета: #${ticket.id}\n\n` +
      `Мы рассмотрим ваше обращение в ближайшее время и ответим через админ-панель.\n` +
      `Спасибо за обращение!`,
      { parse_mode: "Markdown" }
    );
  });
}