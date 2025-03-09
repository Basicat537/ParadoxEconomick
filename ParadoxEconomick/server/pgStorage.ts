import { db } from './db';
import { 
  users, categories, products, orders, paymentMethods, telegramUsers,
  User, InsertUser, Category, InsertCategory, Product, InsertProduct,
  Order, InsertOrder, PaymentMethod, InsertPaymentMethod, TelegramUser, InsertTelegramUser
} from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { IStorage } from './storage';

export class PgStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.date));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.telegramUserId, userId))
      .orderBy(desc(orders.date));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods);
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return result[0];
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const result = await db.insert(paymentMethods).values(method).returning();
    return result[0];
  }

  // Telegram Users
  async getTelegramUser(telegramId: number): Promise<TelegramUser | undefined> {
    const result = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId));
    return result[0];
  }

  async createTelegramUser(user: InsertTelegramUser): Promise<TelegramUser> {
    const result = await db.insert(telegramUsers).values(user).returning();
    return result[0];
  }

  async updateTelegramUser(telegramId: number, user: Partial<InsertTelegramUser>): Promise<TelegramUser | undefined> {
    const result = await db
      .update(telegramUsers)
      .set(user)
      .where(eq(telegramUsers.telegramId, telegramId))
      .returning();
    return result[0];
  }
  
  async getTelegramUserLanguage(telegramId: number): Promise<string> {
    const user = await this.getTelegramUser(telegramId);
    return user?.language || 'en';
  }
  
  async updateTelegramUserLanguage(telegramId: number, language: string): Promise<boolean> {
    try {
      const result = await db
        .update(telegramUsers)
        .set({ language })
        .where(eq(telegramUsers.telegramId, telegramId))
        .returning();
      return !!result[0];
    } catch (error) {
      console.error('Error updating user language:', error);
      return false;
    }
  }

  // Initialize default data for testing
  async initializeDefaultData() {
    // Add default payment methods if none exist
    const existingPaymentMethods = await this.getPaymentMethods();
    if (existingPaymentMethods.length === 0) {
      await this.createPaymentMethod({
        name: 'Crypto (BTC, ETH, USDT)',
        icon: '💰',
        type: 'crypto'
      });
      
      await this.createPaymentMethod({
        name: 'QIWI',
        icon: '💳',
        type: 'p2p'
      });
      
      await this.createPaymentMethod({
        name: 'YooMoney',
        icon: '💸',
        type: 'p2p'
      });
      
      await this.createPaymentMethod({
        name: 'Bank Card',
        icon: '💳',
        type: 'card'
      });
    }
    
    // Add default categories if none exist
    const existingCategories = await this.getCategories();
    if (existingCategories.length === 0) {
      const steamCategory = await this.createCategory({
        name: 'Steam',
        icon: '🎮'
      });
      
      const psCategory = await this.createCategory({
        name: 'PlayStation',
        icon: '🎮'
      });
      
      const xboxCategory = await this.createCategory({
        name: 'Xbox',
        icon: '🎮'
      });
      
      await this.createCategory({
        name: 'Origin',
        icon: '🎮'
      });
      
      await this.createCategory({
        name: 'Battle.net',
        icon: '🎮'
      });
      
      // Add sample products
      if (steamCategory) {
        await this.createProduct({
          name: 'Cyberpunk 2077',
          description: 'An open-world, action-adventure RPG set in the megalopolis of Night City',
          price: '59.99',
          originalPrice: '69.99',
          stock: 10,
          categoryId: steamCategory.id,
          platform: 'Steam',
          region: 'Global',
          status: 'active'
        });
        
        await this.createProduct({
          name: 'Elden Ring',
          description: 'An action RPG game by FromSoftware and Bandai Namco Entertainment',
          price: '49.99',
          stock: 5,
          categoryId: steamCategory.id,
          platform: 'Steam',
          region: 'Global',
          status: 'active'
        });
      }
      
      if (psCategory) {
        await this.createProduct({
          name: 'PlayStation Plus 12-Month',
          description: 'One-year subscription to PlayStation Plus',
          price: '59.99',
          stock: 20,
          categoryId: psCategory.id,
          platform: 'PlayStation',
          region: 'US',
          status: 'active'
        });
      }
      
      if (xboxCategory) {
        await this.createProduct({
          name: 'Xbox Game Pass Ultimate 3-Month',
          description: 'Three-month subscription to Xbox Game Pass Ultimate',
          price: '44.99',
          stock: 15,
          categoryId: xboxCategory.id,
          platform: 'Xbox',
          region: 'Global',
          status: 'active'
        });
      }
    }
    
    // Add a test admin user if none exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      await this.createUser({
        username: 'admin',
        password: 'admin123', // In production, this should be hashed
        role: 'admin'
      });
    }
  }
}

// Create and export the database storage instance
export const pgStorage = new PgStorage();