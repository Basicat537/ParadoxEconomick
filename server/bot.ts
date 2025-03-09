import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export function setupBot() {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, 
        "Добро пожаловать! Пожалуйста, сначала зарегистрируйтесь на нашем сайте, чтобы привязать аккаунт Telegram.");
      return;
    }

    const keyboard = {
      keyboard: [
        [{ text: '🛍 Каталог' }, { text: '🛒 Мои заказы' }],
        [{ text: '💬 Поддержка' }, { text: '👤 Профиль' }]
      ],
      resize_keyboard: true
    };

    bot.sendMessage(chatId, 
      `С возвращением, ${user.username}!\nВыберите опцию из меню ниже:`,
      { reply_markup: keyboard }
    );
  });

  bot.onText(/🛍 Каталог/, async (msg) => {
    const chatId = msg.chat.id;
    const categories = await storage.getCategories();

    const keyboard = {
      inline_keyboard: categories.map(cat => [{
        text: cat.name,
        callback_data: `category_${cat.id}`
      }])
    };

    bot.sendMessage(chatId, "Выберите категорию:", { reply_markup: keyboard });
  });

  bot.on('callback_query', async (query) => {
    if (!query.data || !query.message) return;

    const chatId = query.message.chat.id;

    if (query.data.startsWith('category_')) {
      const categoryId = parseInt(query.data.split('_')[1]);
      const products = await storage.getProducts();
      const categoryProducts = products.filter(p => p.categoryId === categoryId);

      for (const product of categoryProducts) {
        const keyboard = {
          inline_keyboard: [[{
            text: `Купить за $${(product.price / 100).toFixed(2)}`,
            callback_data: `buy_${product.id}`
          }]]
        };

        bot.sendMessage(chatId,
          `*${product.name}*\n${product.description}\nЦена: $${(product.price / 100).toFixed(2)}`,
          { 
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
      }
    }

    if (query.data.startsWith('buy_')) {
      const productId = parseInt(query.data.split('_')[1]);
      const product = await storage.getProduct(productId);

      if (!product) {
        bot.sendMessage(chatId, "Товар не найден");
        return;
      }

      // Генерация инструкций по оплате
      bot.sendMessage(chatId,
        `Для покупки ${product.name}, пожалуйста, выполните оплату:\n\n` +
        `Сумма: $${(product.price / 100).toFixed(2)}\n` +
        `Способы оплаты:\nUSDT (TRC20): <адрес_кошелька>\nBTC: <адрес_кошелька>\n\n` +
        `После оплаты, пожалуйста, отправьте ID транзакции в поддержку.`
      );
    }
  });

  bot.onText(/🛒 Мои заказы/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.");
      return;
    }

    const orders = await storage.getUserOrders(user.id);

    if (orders.length === 0) {
      bot.sendMessage(chatId, "У вас пока нет заказов.");
      return;
    }

    for (const order of orders) {
      const product = await storage.getProduct(order.productId);
      if (!product) continue;

      bot.sendMessage(chatId,
        `Заказ #${order.id}\n` +
        `Товар: ${product.name}\n` +
        `Статус: ${order.status}\n` +
        `Итого: $${(order.totalPrice / 100).toFixed(2)}`
      );
    }
  });

  bot.onText(/💬 Поддержка/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.");
      return;
    }

    bot.sendMessage(chatId,
      "Чтобы создать тикет в поддержку, используйте формат:\n" +
      "/support <ваше сообщение>");
  });

  bot.onText(/\/support (.+)/, async (msg, match) => {
    if (!match) return;

    const chatId = msg.chat.id;
    const user = await storage.getUserByTelegramId(chatId.toString());

    if (!user) {
      bot.sendMessage(chatId, "Пожалуйста, сначала зарегистрируйтесь на нашем сайте.");
      return;
    }

    const ticket = await storage.createTicket({
      userId: user.id,
      subject: "Запрос в поддержку из Telegram",
      message: match[1],
      status: "open"
    });

    bot.sendMessage(chatId,
      `Тикет #${ticket.id} создан.\n` +
      `Мы ответим вам в ближайшее время.`);
  });
}