import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupBot } from "./bot";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  setupBot();

  // Admin routes
  app.get("/api/admin/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/admin/products", async (req, res) => {
    const product = insertProductSchema.parse(req.body);
    const newProduct = await storage.createProduct(product);
    res.status(201).json(newProduct);
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updatedProduct = await storage.updateProduct(id, req.body);
    res.json(updatedProduct);
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  app.get("/api/admin/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/admin/categories", async (req, res) => {
    const category = insertCategorySchema.parse(req.body);
    const newCategory = await storage.createCategory(category);
    res.status(201).json(newCategory);
  });

  app.patch("/api/admin/categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const category = await storage.getCategory(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const updatedCategory = await storage.updateCategory(id, req.body);
    res.json(updatedCategory);
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id);
    res.sendStatus(204);
  });

  app.get("/api/admin/orders", async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.get("/api/admin/tickets", async (req, res) => {
    const tickets = await storage.getTickets();
    res.json(tickets);
  });

  // User routes
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const orders = await storage.getUserOrders(req.user.id);
    res.json(orders);
  });

  app.get("/api/tickets", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const tickets = await storage.getUserTickets(req.user.id);
    res.json(tickets);
  });

  const httpServer = createServer(app);
  return httpServer;
}
