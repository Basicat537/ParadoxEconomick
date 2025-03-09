import { storage } from "../storage";
import { TelegramUpdate, TelegramMessage, TelegramCallbackQuery } from "@shared/types";
import { InsertTelegramUser } from "@shared/schema";
import { processPayment } from "./paymentService";
import { getLocalizedString, getUserLanguage, setUserLanguage, type Language } from "./localization";

// Bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Function to send message to Telegram
async function sendTelegramMessage(chatId: number, text: string, options: any = {}) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

// Function to answer callback query
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error answering callback query:', error);
    throw error;
  }
}

// Function to create inline keyboard
function createInlineKeyboard(buttons: Array<Array<{ text: string; callback_data: string }>>) {
  return {
    reply_markup: {
      inline_keyboard: buttons,
    },
  };
}

// Function to handle user registration
async function handleUserRegistration(user: {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  language?: Language;
}) {
  try {
    // Check if user already exists
    const existingUser = await storage.getTelegramUser(user.telegramId);
    
    if (!existingUser) {
      // Register new user
      const newUser: InsertTelegramUser = {
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        cashbackBalance: 0,
        lastInteraction: new Date(),
        language: user.language || 'en',
      };
      
      await storage.createTelegramUser(newUser);
    } else {
      // Update last interaction time
      await storage.updateTelegramUser(user.telegramId, {
        lastInteraction: new Date(),
      });
      
      // Update language if provided
      if (user.language && user.language !== existingUser.language) {
        await storage.updateTelegramUser(user.telegramId, {
          language: user.language,
        });
      }
    }
  } catch (error) {
    console.error('Error handling user registration:', error);
    throw error;
  }
}

// Function to send language selection menu
async function sendLanguageMenu(chatId: number, userId: number) {
  try {
    const currentLanguage = await storage.getTelegramUserLanguage(userId);
    
    let messageText = "Please select your language / Пожалуйста, выберите ваш язык:";
    
    const buttons = [
      [
        { 
          text: `${currentLanguage === 'en' ? '✓ ' : ''}English 🇬🇧`, 
          callback_data: "set_lang_en" 
        },
        { 
          text: `${currentLanguage === 'ru' ? '✓ ' : ''}Русский 🇷🇺`, 
          callback_data: "set_lang_ru" 
        }
      ],
      [{ text: "🏠 Back / Назад", callback_data: "main_menu" }]
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error sending language menu:', error);
    throw error;
  }
}

// Function to send main menu
async function sendMainMenu(chatId: number, userId: number) {
  // Get user language
  const language = await storage.getTelegramUserLanguage(userId);
  
  // Get localized welcome message
  const menuText = getLocalizedString(userId, 'welcomeMessage');
  
  const menuButtons = [
    [
      { 
        text: getLocalizedString(userId, 'catalog'), 
        callback_data: "catalog" 
      },
      { 
        text: getLocalizedString(userId, 'myAccount'), 
        callback_data: "account" 
      }
    ],
    [
      { 
        text: getLocalizedString(userId, 'minecraftDonates'), 
        callback_data: "minecraft" 
      },
      { 
        text: getLocalizedString(userId, 'support'), 
        callback_data: "support" 
      }
    ],
    [
      { 
        text: `🌐 ${language === 'en' ? 'Язык / Language' : 'Language / Язык'}`, 
        callback_data: "language_menu" 
      }
    ]
  ];
  
  return await sendTelegramMessage(chatId, menuText, createInlineKeyboard(menuButtons));
}

// Function to send categories menu
async function sendCategoriesMenu(chatId: number) {
  try {
    const categories = await storage.getCategories();
    
    const menuText = "Please select a category:";
    
    // Create buttons in pairs
    const categoryButtons: Array<Array<{ text: string; callback_data: string }>> = [];
    let row: Array<{ text: string; callback_data: string }> = [];
    
    categories.forEach((category, index) => {
      row.push({
        text: `${category.icon} ${category.name}`,
        callback_data: `category_${category.id}`,
      });
      
      // Create pairs of buttons
      if (row.length === 2 || index === categories.length - 1) {
        categoryButtons.push([...row]);
        row = [];
      }
    });
    
    // Add back button
    categoryButtons.push([{ text: "🏠 Back to Menu", callback_data: "main_menu" }]);
    
    return await sendTelegramMessage(chatId, menuText, createInlineKeyboard(categoryButtons));
  } catch (error) {
    console.error('Error sending categories menu:', error);
    throw error;
  }
}

// Function to send product list by category
async function sendProductList(chatId: number, categoryId: number, page: number = 1) {
  try {
    const category = await storage.getCategory(categoryId);
    if (!category) {
      return await sendTelegramMessage(chatId, "Category not found.");
    }
    
    const products = await storage.getProductsByCategory(categoryId);
    
    // Filter only active products with stock > 0
    const availableProducts = products.filter(p => p.status === 'active' && p.stock > 0);
    
    if (availableProducts.length === 0) {
      return await sendTelegramMessage(
        chatId, 
        `No available products in ${category.name} category.`,
        createInlineKeyboard([[{ text: "🔙 Back to Categories", callback_data: "catalog" }]])
      );
    }
    
    // Pagination
    const itemsPerPage = 5;
    const totalPages = Math.ceil(availableProducts.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, availableProducts.length);
    const currentPageProducts = availableProducts.slice(startIndex, endIndex);
    
    // Create message text
    let messageText = `<b>${category.icon} ${category.name} Products</b>\n\n`;
    messageText += `Showing ${startIndex + 1}-${endIndex} of ${availableProducts.length} products\n\n`;
    
    // Create product buttons
    const productButtons: Array<Array<{ text: string; callback_data: string }>> = [];
    
    currentPageProducts.forEach(product => {
      const buttonText = `${product.name} - $${product.price}`;
      productButtons.push([{
        text: buttonText,
        callback_data: `product_${product.id}`,
      }]);
    });
    
    // Pagination buttons
    const paginationButtons = [];
    
    if (page > 1) {
      paginationButtons.push({
        text: "◀️ Previous",
        callback_data: `category_${categoryId}_page_${page - 1}`,
      });
    }
    
    if (page < totalPages) {
      paginationButtons.push({
        text: "Next ▶️",
        callback_data: `category_${categoryId}_page_${page + 1}`,
      });
    }
    
    if (paginationButtons.length > 0) {
      productButtons.push(paginationButtons);
    }
    
    // Back button
    productButtons.push([{ text: "🔙 Back to Categories", callback_data: "catalog" }]);
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(productButtons));
  } catch (error) {
    console.error('Error sending product list:', error);
    throw error;
  }
}

// Function to send product details
async function sendProductDetails(chatId: number, productId: number) {
  try {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return await sendTelegramMessage(chatId, "Product not found.");
    }
    
    let messageText = `<b>${product.name}</b>\n\n`;
    messageText += `${product.description}\n\n`;
    messageText += `Platform: ${product.platform}\n`;
    messageText += `Region: ${product.region}\n`;
    messageText += `Price: $${product.price}`;
    
    if (product.originalPrice && product.originalPrice > product.price) {
      messageText += ` (was $${product.originalPrice})`;
    }
    
    messageText += `\n\nIn stock: ${product.stock} keys available`;
    
    const buttons = [
      [{ text: "🛒 Buy Now", callback_data: `buy_${product.id}` }],
      [{ text: "🔙 Back to Products", callback_data: `category_${product.categoryId}` }],
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error sending product details:', error);
    throw error;
  }
}

// Function to send payment methods
async function sendPaymentMethods(chatId: number, productId: number) {
  try {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return await sendTelegramMessage(chatId, "Product not found.");
    }
    
    const paymentMethods = await storage.getPaymentMethods();
    
    let messageText = `<b>Select Payment Method</b>\n\n`;
    messageText += `Product: ${product.name}\n`;
    messageText += `Price: $${product.price}`;
    
    const paymentButtons: Array<Array<{ text: string; callback_data: string }>> = [];
    
    paymentMethods.forEach(method => {
      paymentButtons.push([{
        text: method.name,
        callback_data: `pay_${method.id}_product_${productId}`,
      }]);
    });
    
    // Back button
    paymentButtons.push([{
      text: "🔙 Back to Product",
      callback_data: `product_${productId}`,
    }]);
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(paymentButtons));
  } catch (error) {
    console.error('Error sending payment methods:', error);
    throw error;
  }
}

// Function to send payment details
async function sendPaymentDetails(chatId: number, methodId: number, productId: number) {
  try {
    const paymentMethod = await storage.getPaymentMethod(methodId);
    const product = await storage.getProduct(productId);
    
    if (!paymentMethod || !product) {
      return await sendTelegramMessage(chatId, "Payment method or product not found.");
    }
    
    // Create crypto payment address (in a real app, this would be from a payment provider)
    const paymentAddress = "TWJk7hy8NHnZ5F9ZGKXfpBD4dQr75ZJPx1";
    
    let messageText = `<b>Payment Details</b>\n\n`;
    messageText += `Payment Method: ${paymentMethod.name}\n`;
    messageText += `Product: ${product.name}\n`;
    messageText += `Amount: $${product.price}\n\n`;
    
    if (paymentMethod.type === 'crypto') {
      messageText += `Please send <b>${product.price} USDT</b> to the following address:\n\n`;
      messageText += `<code>${paymentAddress}</code>\n\n`;
      messageText += `Your order will be processed automatically after payment confirmation (1-3 confirmations required).\n\n`;
      messageText += `⏱ Payment expires in 15 minutes.`;
    } else if (paymentMethod.type === 'p2p') {
      messageText += `Please send $${product.price} via ${paymentMethod.name} to:\n\n`;
      messageText += `<code>payment@gamestore.com</code>\n\n`;
      messageText += `Include your Telegram username in the payment comment.`;
    } else {
      messageText += `Click the button below to proceed with the card payment.`;
    }
    
    const buttons = [
      [{ text: "✅ I've Paid", callback_data: `confirm_payment_${productId}_${methodId}` }],
      [{ text: "🔙 Change Method", callback_data: `buy_${productId}` }],
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error sending payment details:', error);
    throw error;
  }
}

// Function to handle payment confirmation
async function handlePaymentConfirmation(
  chatId: number, 
  userId: number, 
  productId: number, 
  methodId: number,
  firstName: string,
  lastName?: string,
  username?: string
) {
  try {
    const product = await storage.getProduct(productId);
    const paymentMethod = await storage.getPaymentMethod(methodId);
    
    if (!product || !paymentMethod) {
      return await sendTelegramMessage(chatId, "Product or payment method not found.");
    }
    
    // Process payment (in a real app, this would verify with a payment provider)
    const paymentResult = await processPayment({
      amount: product.price,
      method: paymentMethod.type,
      productId,
      userId
    });
    
    if (!paymentResult.success) {
      return await sendTelegramMessage(
        chatId, 
        `❌ Payment failed: ${paymentResult.message}`,
        createInlineKeyboard([[{ text: "Try Again", callback_data: `pay_${methodId}_product_${productId}` }]])
      );
    }
    
    // Create product key (in a real app, this would be from inventory)
    const productKey = `XXXX-YYYY-ZZZZ-AAAA-BBBB`;
    
    // Record the order
    const order = await storage.createOrder({
      telegramUserId: userId,
      productId,
      productName: product.name,
      quantity: 1,
      totalAmount: product.price,
      paymentMethodId: methodId,
      paymentStatus: 'completed',
      deliveryStatus: 'delivered',
      productKey,
    });
    
    // Update product stock
    await storage.updateProduct(productId, {
      stock: product.stock - 1
    });
    
    // Register user if not exists
    await handleUserRegistration({
      telegramId: userId,
      firstName,
      lastName,
      username
    });
    
    // Send confirmation
    let messageText = `✅ <b>Payment Confirmed! Here is your purchase:</b>\n\n`;
    messageText += `<b>${product.name}</b>\n`;
    messageText += `Platform: ${product.platform}\n`;
    messageText += `Region: ${product.region}\n\n`;
    messageText += `<b>Your key:</b>\n`;
    messageText += `<code>${productKey}</code>\n\n`;
    
    if (product.platform === 'Steam') {
      messageText += `<b>Activation:</b> Open Steam → Games → Activate a Product on Steam\n\n`;
    }
    
    messageText += `<b>Order ID:</b> #${order.id}\n`;
    messageText += `<b>Date:</b> ${new Date().toLocaleDateString()}\n\n`;
    messageText += `Thank you for your purchase! If you have any issues, please contact our support.`;
    
    const buttons = [
      [{ text: "🏠 Back to Main Menu", callback_data: "main_menu" }]
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error handling payment confirmation:', error);
    throw error;
  }
}

// Function to send user account
async function sendUserAccount(chatId: number, userId: number) {
  try {
    // Get user info
    const user = await storage.getTelegramUser(userId);
    
    if (!user) {
      return await sendTelegramMessage(
        chatId, 
        "User not found. Please try again later.",
        createInlineKeyboard([[{ text: "🏠 Main Menu", callback_data: "main_menu" }]])
      );
    }
    
    // Get user orders
    const orders = await storage.getUserOrders(userId);
    
    let messageText = `<b>👤 Your Account Information:</b>\n\n`;
    messageText += `Name: ${user.firstName} ${user.lastName || ''}\n`;
    
    if (user.username) {
      messageText += `Username: @${user.username}\n`;
    }
    
    messageText += `Cashback Balance: $${user.cashbackBalance}\n\n`;
    
    if (orders.length > 0) {
      messageText += `<b>Recent Orders:</b>\n\n`;
      
      // Show last 5 orders
      const recentOrders = orders.slice(0, 5);
      
      recentOrders.forEach(order => {
        messageText += `${order.productName} - $${order.totalAmount}\n`;
        messageText += `Order #${order.id} - ${new Date(order.date).toLocaleDateString()}\n\n`;
      });
      
      if (orders.length > 5) {
        messageText += `...and ${orders.length - 5} more order(s).`;
      }
    } else {
      messageText += `You have no orders yet.`;
    }
    
    const buttons = [
      [{ text: "📋 All Orders", callback_data: "all_orders" }],
      [{ text: "🏠 Main Menu", callback_data: "main_menu" }],
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error sending user account:', error);
    throw error;
  }
}

// Function to send support menu
async function sendSupportMenu(chatId: number) {
  try {
    let messageText = `<b>How can we help you today?</b>\n\n`;
    messageText += `<b>Frequently Asked Questions:</b>\n\n`;
    messageText += `1. How to activate a Steam key?\n`;
    messageText += `2. My payment was successful but I didn't receive my key\n`;
    messageText += `3. How to use my cashback?\n`;
    messageText += `4. Can I get a refund?\n\n`;
    messageText += `If you can't find an answer, click the button below to contact our support team.`;
    
    const buttons = [
      [{ text: "📝 Contact Support", callback_data: "contact_support" }],
      [{ text: "🏠 Back to Main Menu", callback_data: "main_menu" }],
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error sending support menu:', error);
    throw error;
  }
}

// Function to handle contact support
async function handleContactSupport(chatId: number) {
  try {
    let messageText = `Please describe your issue in detail. Our support team will respond as soon as possible.\n\n`;
    messageText += `<i>Just send your message as a reply to this message.</i>`;
    
    const buttons = [
      [{ text: "🔙 Cancel", callback_data: "support" }],
    ];
    
    return await sendTelegramMessage(chatId, messageText, createInlineKeyboard(buttons));
  } catch (error) {
    console.error('Error handling contact support:', error);
    throw error;
  }
}

// Function to handle message from user
async function handleMessage(message: TelegramMessage) {
  try {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    
    // User data for registration
    const userData = {
      telegramId: userId,
      firstName: message.from.first_name,
      lastName: message.from.last_name,
      username: message.from.username,
    };
    
    // Register user if this is their first interaction
    await handleUserRegistration(userData);
    
    // Handle commands
    if (text.startsWith('/')) {
      switch (text) {
        case '/start':
          return await sendMainMenu(chatId);
        case '/catalog':
          return await sendCategoriesMenu(chatId);
        case '/account':
          return await sendUserAccount(chatId, userId);
        case '/support':
          return await sendSupportMenu(chatId);
        default:
          return await sendTelegramMessage(
            chatId, 
            "I don't understand that command. Please use the menu options.",
            createInlineKeyboard([[{ text: "🏠 Main Menu", callback_data: "main_menu" }]])
          );
      }
    }
    
    // If not a command, handle as support message or regular text
    return await sendTelegramMessage(
      chatId,
      "Thanks for your message. Our support team will get back to you soon.",
      createInlineKeyboard([[{ text: "🏠 Main Menu", callback_data: "main_menu" }]])
    );
  } catch (error) {
    console.error('Error handling message:', error);
    throw error;
  }
}

// Function to handle callback query
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) {
  try {
    const callbackQueryId = callbackQuery.id;
    const data = callbackQuery.data || '';
    const message = callbackQuery.message;
    
    if (!message) {
      return await answerCallbackQuery(callbackQueryId, "Message not found.");
    }
    
    const chatId = message.chat.id;
    const userId = callbackQuery.from.id;
    
    // User data for registration
    const userData = {
      telegramId: userId,
      firstName: callbackQuery.from.first_name,
      lastName: callbackQuery.from.last_name,
      username: callbackQuery.from.username,
    };
    
    // Register user if this is their first interaction
    await handleUserRegistration(userData);
    
    // Handle callback data
    if (data === 'main_menu') {
      await answerCallbackQuery(callbackQueryId);
      return await sendMainMenu(chatId);
    } else if (data === 'catalog') {
      await answerCallbackQuery(callbackQueryId);
      return await sendCategoriesMenu(chatId);
    } else if (data === 'account') {
      await answerCallbackQuery(callbackQueryId);
      return await sendUserAccount(chatId, userId);
    } else if (data === 'minecraft') {
      // Find Minecraft category
      const categories = await storage.getCategories();
      const minecraftCategory = categories.find(c => c.name.toLowerCase() === 'minecraft');
      
      if (minecraftCategory) {
        await answerCallbackQuery(callbackQueryId);
        return await sendProductList(chatId, minecraftCategory.id);
      } else {
        await answerCallbackQuery(callbackQueryId, "Minecraft category not found.");
        return await sendCategoriesMenu(chatId);
      }
    } else if (data === 'support') {
      await answerCallbackQuery(callbackQueryId);
      return await sendSupportMenu(chatId);
    } else if (data === 'contact_support') {
      await answerCallbackQuery(callbackQueryId);
      return await handleContactSupport(chatId);
    } else if (data.startsWith('category_')) {
      await answerCallbackQuery(callbackQueryId);
      
      if (data.includes('_page_')) {
        // Handle pagination
        const parts = data.split('_page_');
        const categoryId = parseInt(parts[0].replace('category_', ''));
        const page = parseInt(parts[1]);
        
        return await sendProductList(chatId, categoryId, page);
      } else {
        // Regular category selection
        const categoryId = parseInt(data.replace('category_', ''));
        return await sendProductList(chatId, categoryId);
      }
    } else if (data.startsWith('product_')) {
      await answerCallbackQuery(callbackQueryId);
      const productId = parseInt(data.replace('product_', ''));
      return await sendProductDetails(chatId, productId);
    } else if (data.startsWith('buy_')) {
      await answerCallbackQuery(callbackQueryId);
      const productId = parseInt(data.replace('buy_', ''));
      return await sendPaymentMethods(chatId, productId);
    } else if (data.startsWith('pay_')) {
      await answerCallbackQuery(callbackQueryId);
      
      const parts = data.split('_product_');
      const methodId = parseInt(parts[0].replace('pay_', ''));
      const productId = parseInt(parts[1]);
      
      return await sendPaymentDetails(chatId, methodId, productId);
    } else if (data.startsWith('confirm_payment_')) {
      await answerCallbackQuery(callbackQueryId, "Processing payment...");
      
      const parts = data.split('_');
      const productId = parseInt(parts[2]);
      const methodId = parseInt(parts[3]);
      
      return await handlePaymentConfirmation(
        chatId, 
        userId, 
        productId, 
        methodId,
        userData.firstName,
        userData.lastName,
        userData.username
      );
    } else {
      await answerCallbackQuery(callbackQueryId, "Action not supported.");
      return await sendMainMenu(chatId);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    throw error;
  }
}

// Main function to handle Telegram updates
export async function handleTelegramUpdate(update: TelegramUpdate) {
  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    throw error;
  }
}
