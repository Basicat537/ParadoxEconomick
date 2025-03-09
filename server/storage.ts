import { eq } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import {
  users, products, categories, orders, support_tickets,
  type User, type InsertUser,
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type SupportTicket, type InsertTicket
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  
  // Support ticket operations
  getTicket(id: number): Promise<SupportTicket | undefined>;
  getTickets(): Promise<SupportTicket[]>;
  getUserTickets(userId: number): Promise<SupportTicket[]>;
  createTicket(ticket: InsertTicket): Promise<SupportTicket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<SupportTicket>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Support ticket operations
  async getTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(support_tickets).where(eq(support_tickets.id, id));
    return ticket;
  }

  async getTickets(): Promise<SupportTicket[]> {
    return await db.select().from(support_tickets);
  }

  async getUserTickets(userId: number): Promise<SupportTicket[]> {
    return await db.select().from(support_tickets).where(eq(support_tickets.userId, userId));
  }

  async createTicket(ticket: InsertTicket): Promise<SupportTicket> {
    const [newTicket] = await db.insert(support_tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<SupportTicket> {
    const [updatedTicket] = await db
      .update(support_tickets)
      .set(ticket)
      .where(eq(support_tickets.id, id))
      .returning();
    return updatedTicket;
  }
}

export const storage = new DatabaseStorage();
