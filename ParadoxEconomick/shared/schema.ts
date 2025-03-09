import { pgTable, text, serial, integer, decimal, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (for admin access)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Categories (Steam, PS Store, etc.)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
});

// Products (games, subscriptions)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull(),
  categoryId: integer("category_id").notNull(),
  platform: text("platform").notNull(),
  region: text("region").notNull(),
  status: text("status").notNull().default("active"), // active, out_of_stock, hidden
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  originalPrice: true,
  stock: true,
  categoryId: true,
  platform: true,
  region: true,
  status: true,
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  telegramUserId: bigint("telegram_user_id", { mode: "number" }),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethodId: integer("payment_method_id").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed
  deliveryStatus: text("delivery_status").notNull().default("pending"), // pending, delivered, failed
  productKey: text("product_key"),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  telegramUserId: true,
  productId: true,
  productName: true,
  quantity: true,
  totalAmount: true,
  paymentMethodId: true,
  paymentStatus: true,
  deliveryStatus: true,
  productKey: true,
});

// Payment methods
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(), // crypto, p2p, card
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  name: true,
  icon: true,
  type: true,
});

// Telegram users
export const telegramUsers = pgTable("telegram_users", {
  telegramId: bigint("telegram_id", { mode: "number" }).primaryKey(),
  username: text("username"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  cashbackBalance: decimal("cashback_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  lastInteraction: timestamp("last_interaction").notNull().defaultNow(),
  language: text("language").notNull().default("en"),
});

export const insertTelegramUserSchema = createInsertSchema(telegramUsers).pick({
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  cashbackBalance: true,
  lastInteraction: true,
  language: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
