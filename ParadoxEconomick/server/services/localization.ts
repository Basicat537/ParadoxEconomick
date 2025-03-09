export type Language = 'en' | 'ru';

export interface LocalizationStrings {
  // Main menu
  welcomeMessage: string;
  catalog: string;
  myAccount: string;
  minecraftDonates: string;
  support: string;
  backToMenu: string;
  
  // Categories
  selectCategory: string;
  backToCategories: string;
  
  // Products
  productNotFound: string;
  categoryNotFound: string;
  noAvailableProducts: string;
  showingProducts: string;
  platform: string;
  region: string;
  price: string;
  wasPrice: string;
  inStock: string;
  keysAvailable: string;
  previous: string;
  next: string;
  buyNow: string;
  backToProducts: string;
  
  // Payment
  selectPaymentMethod: string;
  paymentMethodProductInfo: string;
  backToProduct: string;
  paymentDetails: string;
  paymentMethod: string;
  product: string;
  amount: string;
  cryptoPaymentInstructions: string;
  p2pPaymentInstructions: string;
  cardPaymentInstructions: string;
  paymentExpires: string;
  iPaid: string;
  changeMethod: string;
  paymentFailed: string;
  tryAgain: string;
  
  // Order confirmation
  paymentConfirmed: string;
  yourKey: string;
  activation: string;
  steamActivation: string;
  orderID: string;
  date: string;
  thankYou: string;
  
  // User account
  userNotFound: string;
  accountInformation: string;
  name: string;
  username: string;
  cashbackBalance: string;
  recentOrders: string;
  noOrders: string;
  andMore: string;
  allOrders: string;
  
  // Support
  helpQuestion: string;
  faqHeading: string;
  faqSteamActivation: string;
  faqNoKey: string;
  faqCashback: string;
  faqRefund: string;
  contactSupport: string;
  writeYourQuestion: string;
  send: string;
  messageReceived: string;
  supportTeamReply: string;
  
  // Common
  error: string;
}

export const localizations: Record<Language, LocalizationStrings> = {
  en: {
    // Main menu
    welcomeMessage: "👋 Welcome to GameStore Bot! What would you like to do today?",
    catalog: "🛒 Catalog",
    myAccount: "👤 My Account",
    minecraftDonates: "💎 Minecraft Donates",
    support: "❓ Support",
    backToMenu: "🏠 Back to Menu",
    
    // Categories
    selectCategory: "Please select a category:",
    backToCategories: "🔙 Back to Categories",
    
    // Products
    productNotFound: "Product not found.",
    categoryNotFound: "Category not found.",
    noAvailableProducts: "No available products in %category% category.",
    showingProducts: "Showing %start%-%end% of %total% products",
    platform: "Platform",
    region: "Region",
    price: "Price",
    wasPrice: "was",
    inStock: "In stock",
    keysAvailable: "keys available",
    previous: "◀️ Previous",
    next: "Next ▶️",
    buyNow: "🛒 Buy Now",
    backToProducts: "🔙 Back to Products",
    
    // Payment
    selectPaymentMethod: "Select Payment Method",
    paymentMethodProductInfo: "Product: %product%\nPrice: $%price%",
    backToProduct: "🔙 Back to Product",
    paymentDetails: "Payment Details",
    paymentMethod: "Payment Method",
    product: "Product",
    amount: "Amount",
    cryptoPaymentInstructions: "Please send <b>%amount% USDT</b> to the following address:\n\n<code>%address%</code>\n\nYour order will be processed automatically after payment confirmation (1-3 confirmations required).",
    p2pPaymentInstructions: "Please send $%amount% via %method% to:\n\n<code>payment@gamestore.com</code>\n\nInclude your Telegram username in the payment comment.",
    cardPaymentInstructions: "Click the button below to proceed with the card payment.",
    paymentExpires: "⏱ Payment expires in 15 minutes.",
    iPaid: "✅ I've Paid",
    changeMethod: "🔙 Change Method",
    paymentFailed: "❌ Payment failed: %message%",
    tryAgain: "Try Again",
    
    // Order confirmation
    paymentConfirmed: "✅ Payment Confirmed! Here is your purchase:",
    yourKey: "Your key:",
    activation: "Activation:",
    steamActivation: "Open Steam → Games → Activate a Product on Steam",
    orderID: "Order ID:",
    date: "Date:",
    thankYou: "Thank you for your purchase! If you have any issues, please contact our support.",
    
    // User account
    userNotFound: "User not found. Please try again later.",
    accountInformation: "👤 Your Account Information:",
    name: "Name",
    username: "Username",
    cashbackBalance: "Cashback Balance",
    recentOrders: "Recent Orders:",
    noOrders: "You have no orders yet.",
    andMore: "...and %count% more order(s).",
    allOrders: "📋 All Orders",
    
    // Support
    helpQuestion: "How can we help you today?",
    faqHeading: "Frequently Asked Questions:",
    faqSteamActivation: "1. How to activate a Steam key?",
    faqNoKey: "2. My payment was successful but I didn't receive my key",
    faqCashback: "3. How to use my cashback?",
    faqRefund: "4. Can I get a refund?",
    contactSupport: "Contact Support",
    writeYourQuestion: "Please write your question below:",
    send: "Send",
    messageReceived: "Your message has been received. Our support team will respond shortly.",
    supportTeamReply: "Support team will contact you soon.",
    
    // Common
    error: "An error occurred. Please try again later."
  },
  
  ru: {
    // Main menu
    welcomeMessage: "👋 Добро пожаловать в GameStore Бот! Что вы хотите сделать сегодня?",
    catalog: "🛒 Каталог",
    myAccount: "👤 Мой аккаунт",
    minecraftDonates: "💎 Донаты Minecraft",
    support: "❓ Поддержка",
    backToMenu: "🏠 Вернуться в меню",
    
    // Categories
    selectCategory: "Пожалуйста, выберите категорию:",
    backToCategories: "🔙 Назад к категориям",
    
    // Products
    productNotFound: "Товар не найден.",
    categoryNotFound: "Категория не найдена.",
    noAvailableProducts: "Нет доступных товаров в категории %category%.",
    showingProducts: "Показано %start%-%end% из %total% товаров",
    platform: "Платформа",
    region: "Регион",
    price: "Цена",
    wasPrice: "было",
    inStock: "В наличии",
    keysAvailable: "ключей доступно",
    previous: "◀️ Предыдущая",
    next: "Следующая ▶️",
    buyNow: "🛒 Купить сейчас",
    backToProducts: "🔙 Назад к товарам",
    
    // Payment
    selectPaymentMethod: "Выберите способ оплаты",
    paymentMethodProductInfo: "Товар: %product%\nЦена: $%price%",
    backToProduct: "🔙 Назад к товару",
    paymentDetails: "Детали оплаты",
    paymentMethod: "Способ оплаты",
    product: "Товар",
    amount: "Сумма",
    cryptoPaymentInstructions: "Пожалуйста, отправьте <b>%amount% USDT</b> на следующий адрес:\n\n<code>%address%</code>\n\nВаш заказ будет обработан автоматически после подтверждения платежа (требуется 1-3 подтверждения).",
    p2pPaymentInstructions: "Пожалуйста, отправьте $%amount% через %method% на:\n\n<code>payment@gamestore.com</code>\n\nУкажите ваше имя пользователя Telegram в комментарии к платежу.",
    cardPaymentInstructions: "Нажмите кнопку ниже, чтобы продолжить оплату картой.",
    paymentExpires: "⏱ Срок действия платежа истекает через 15 минут.",
    iPaid: "✅ Я оплатил",
    changeMethod: "🔙 Изменить способ",
    paymentFailed: "❌ Ошибка оплаты: %message%",
    tryAgain: "Попробовать снова",
    
    // Order confirmation
    paymentConfirmed: "✅ Платеж подтвержден! Вот ваша покупка:",
    yourKey: "Ваш ключ:",
    activation: "Активация:",
    steamActivation: "Откройте Steam → Игры → Активировать продукт в Steam",
    orderID: "Номер заказа:",
    date: "Дата:",
    thankYou: "Спасибо за покупку! Если у вас возникнут проблемы, пожалуйста, обратитесь в нашу службу поддержки.",
    
    // User account
    userNotFound: "Пользователь не найден. Пожалуйста, попробуйте позже.",
    accountInformation: "👤 Информация о вашем аккаунте:",
    name: "Имя",
    username: "Имя пользователя",
    cashbackBalance: "Баланс кэшбэка",
    recentOrders: "Недавние заказы:",
    noOrders: "У вас пока нет заказов.",
    andMore: "...и еще %count% заказ(ов).",
    allOrders: "📋 Все заказы",
    
    // Support
    helpQuestion: "Как мы можем помочь вам сегодня?",
    faqHeading: "Часто задаваемые вопросы:",
    faqSteamActivation: "1. Как активировать ключ Steam?",
    faqNoKey: "2. Мой платеж прошел успешно, но я не получил ключ",
    faqCashback: "3. Как использовать мой кэшбэк?",
    faqRefund: "4. Могу ли я получить возврат средств?",
    contactSupport: "Связаться с поддержкой",
    writeYourQuestion: "Пожалуйста, напишите ваш вопрос ниже:",
    send: "Отправить",
    messageReceived: "Ваше сообщение получено. Наша команда поддержки ответит в ближайшее время.",
    supportTeamReply: "Команда поддержки свяжется с вами в ближайшее время.",
    
    // Common
    error: "Произошла ошибка. Пожалуйста, попробуйте позже."
  }
};

// Store user language preferences
const userLanguages: Map<number, Language> = new Map();

// Get user language or default to English
export function getUserLanguage(userId: number): Language {
  return userLanguages.get(userId) || 'en';
}

// Set user language preference
export function setUserLanguage(userId: number, language: Language): void {
  userLanguages.set(userId, language);
}

// Get localized string for the user
export function getLocalizedString(userId: number, key: keyof LocalizationStrings, replacements?: Record<string, string | number>): string {
  const language = getUserLanguage(userId);
  let text = localizations[language][key];
  
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`%${placeholder}%`, String(value));
    });
  }
  
  return text;
}