import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  telegramId: text("telegram_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  digital_content: text("digital_content").notNull(),
  stock: integer("stock").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull(), // pending, paid, delivered, cancelled
  paymentData: jsonb("payment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const support_tickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // open, closed
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  telegramId: true
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true
});

export const insertProductSchema = createInsertSchema(products).pick({
  categoryId: true,
  name: true, 
  description: true,
  price: true,
  digital_content: true,
  stock: true
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  productId: true,
  quantity: true,
  totalPrice: true,
  status: true,
  paymentData: true
});

export const insertTicketSchema = createInsertSchema(support_tickets).pick({
  userId: true,
  subject: true,
  message: true,
  status: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type SupportTicket = typeof support_tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
