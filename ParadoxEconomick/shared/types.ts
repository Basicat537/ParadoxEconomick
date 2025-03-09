// This file contains TypeScript types used in the frontend

// Product status type
export type ProductStatus = 'active' | 'out_of_stock' | 'hidden';

// Category interface
export interface Category {
  id: number;
  name: string;
  icon: string;
}

// Product interface
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: number;
  platform: string;
  region: string;
  status: ProductStatus;
}

// Payment method type
export type PaymentMethodType = 'crypto' | 'p2p' | 'card';

// Payment method interface
export interface PaymentMethod {
  id: number;
  name: string;
  icon: string;
  type: PaymentMethodType;
}

// Order payment status
export type PaymentStatus = 'pending' | 'completed' | 'failed';

// Order delivery status
export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

// Order interface
export interface Order {
  id: number;
  userId?: number;
  telegramUserId?: number;
  productId: number;
  productName: string;
  quantity: number;
  totalAmount: number;
  paymentMethodId: number;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  productKey?: string;
  date: string;
}

// Telegram user interface
export interface TelegramUser {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  cashbackBalance: number;
  lastInteraction: string;
}

// Telegram message interface
export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  date: number;
  text?: string;
}

// Telegram callback query interface
export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: TelegramMessage;
  chat_instance: string;
  data?: string;
}

// Telegram update interface
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}
