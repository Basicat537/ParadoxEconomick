import { 
  User, 
  Category, 
  Product, 
  Order, 
  PaymentMethod,
  TelegramUser,
  type InsertUser, 
  type InsertCategory,
  type InsertProduct,
  type InsertOrder,
  type InsertPaymentMethod,
  type InsertTelegramUser
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Payment Methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  
  // Telegram Users
  getTelegramUser(telegramId: number): Promise<TelegramUser | undefined>;
  createTelegramUser(user: InsertTelegramUser): Promise<TelegramUser>;
  updateTelegramUser(telegramId: number, user: Partial<InsertTelegramUser>): Promise<TelegramUser | undefined>;
  getTelegramUserLanguage(telegramId: number): Promise<string>;
  updateTelegramUserLanguage(telegramId: number, language: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private paymentMethods: Map<number, PaymentMethod>;
  private telegramUsers: Map<number, TelegramUser>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private productIdCounter: number;
  private orderIdCounter: number;
  private paymentMethodIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.paymentMethods = new Map();
    this.telegramUsers = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productIdCounter = 1;
    this.orderIdCounter = 1;
    this.paymentMethodIdCounter = 1;
    
    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create categories
    const categories: InsertCategory[] = [
      { name: "Steam", icon: "🎮" },
      { name: "PS Store", icon: "🎮" },
      { name: "Xbox", icon: "🎮" },
      { name: "Nintendo", icon: "🎮" },
      { name: "Minecraft", icon: "⛏️" }
    ];
    
    categories.forEach(category => this.createCategory(category));
    
    // Create products
    const products: InsertProduct[] = [
      { 
        name: "Cyberpunk 2077", 
        description: "An open-world, action-adventure RPG set in the megalopolis of Night City.",
        price: 39.99,
        originalPrice: 59.99,
        stock: 15,
        categoryId: 1,
        platform: "PC",
        region: "Global Key",
        status: "active"
      },
      { 
        name: "Red Dead Redemption 2", 
        description: "America, 1899. The end of the Wild West era has begun.",
        price: 29.99,
        originalPrice: 59.99,
        stock: 8,
        categoryId: 1,
        platform: "PC",
        region: "Global Key",
        status: "active"
      },
      { 
        name: "God of War", 
        description: "His vengeance against the Gods of Olympus years behind him, Kratos now lives as a man in the realm of Norse Gods and monsters.",
        price: 19.99,
        originalPrice: 39.99,
        stock: 0,
        categoryId: 2,
        platform: "PS4/PS5",
        region: "Global Key",
        status: "out_of_stock"
      },
      { 
        name: "Minecraft Java Edition", 
        description: "Create, explore and survive alone or with friends on mobile devices or Windows 10.",
        price: 26.99,
        originalPrice: 0,
        stock: 20,
        categoryId: 5,
        platform: "PC",
        region: "Global Key",
        status: "active"
      },
      { 
        name: "Halo Infinite", 
        description: "The Master Chief returns in the next chapter of the legendary franchise in a genre-defining gameplay experience.",
        price: 59.99,
        originalPrice: 0,
        stock: 5,
        categoryId: 3,
        platform: "Xbox/PC",
        region: "Global Key",
        status: "active"
      }
    ];
    
    products.forEach(product => this.createProduct(product));
    
    // Create payment methods
    const paymentMethods: InsertPaymentMethod[] = [
      { 
        name: "Crypto (BTC, ETH, USDT)", 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
        type: "crypto" 
      },
      { 
        name: "QIWI, YooMoney, Bank Transfer", 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
        type: "p2p" 
      },
      { 
        name: "Card Payment (FreeKassa)", 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>',
        type: "card" 
      }
    ];
    
    paymentMethods.forEach(method => this.createPaymentMethod(method));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    
    if (!existingCategory) {
      return undefined;
    }
    
    const updatedCategory = { ...existingCategory, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    
    if (!existingProduct) {
      return undefined;
    }
    
    const updatedProduct = { ...existingProduct, ...productUpdate };
    this.products.set(id, updatedProduct);
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const order: Order = { ...insertOrder, id };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    
    if (!existingOrder) {
      return undefined;
    }
    
    const updatedOrder = { ...existingOrder, ...orderUpdate };
    this.orders.set(id, updatedOrder);
    
    return updatedOrder;
  }
  
  // Payment Method methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values());
  }
  
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    return this.paymentMethods.get(id);
  }
  
  async createPaymentMethod(insertMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = this.paymentMethodIdCounter++;
    const method: PaymentMethod = { ...insertMethod, id };
    this.paymentMethods.set(id, method);
    return method;
  }
  
  // Telegram User methods
  async getTelegramUser(telegramId: number): Promise<TelegramUser | undefined> {
    return this.telegramUsers.get(telegramId);
  }
  
  async createTelegramUser(insertUser: InsertTelegramUser): Promise<TelegramUser> {
    const user: TelegramUser = { ...insertUser };
    this.telegramUsers.set(insertUser.telegramId, user);
    return user;
  }
  
  async updateTelegramUser(telegramId: number, userUpdate: Partial<InsertTelegramUser>): Promise<TelegramUser | undefined> {
    const existingUser = this.telegramUsers.get(telegramId);
    
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser = { ...existingUser, ...userUpdate };
    this.telegramUsers.set(telegramId, updatedUser);
    
    return updatedUser;
  }
  
  async getTelegramUserLanguage(telegramId: number): Promise<string> {
    const user = await this.getTelegramUser(telegramId);
    return user?.language || 'en';
  }
  
  async updateTelegramUserLanguage(telegramId: number, language: string): Promise<boolean> {
    const existingUser = this.telegramUsers.get(telegramId);
    
    if (!existingUser) {
      return false;
    }
    
    const updatedUser = { 
      ...existingUser, 
      language 
    };
    
    this.telegramUsers.set(telegramId, updatedUser);
    return true;
  }
}

// Import the PostgreSQL storage implementation
import { pgStorage } from './pgStorage';

// Export PostgreSQL storage as the default storage
export const storage = pgStorage;
