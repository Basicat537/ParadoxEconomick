import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import { pgStorage } from "./pgStorage";
import { setupTelegramWebhook } from "./webhooks/telegram";
import { startPolling } from "./services/telegramBotPolling";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Initialize default data in database
    await pgStorage.initializeDefaultData();
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Setup Telegram webhook
    setupTelegramWebhook(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Check for Telegram bot token
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        log(`To set up your Telegram webhook, visit: /webhook/telegram/setup?url=YOUR_SERVER_URL`);
        
        // Start bot in long polling mode
        log(`Starting Telegram bot in polling mode...`);
        // Start in a non-blocking way
        startPolling().catch(err => {
          console.error('Error starting Telegram bot polling:', err);
        });
      } else {
        log(`Warning: TELEGRAM_BOT_TOKEN not set. Telegram bot functionality will not work.`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
