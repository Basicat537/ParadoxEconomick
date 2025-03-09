import type { Express } from "express";
import { handleTelegramUpdate } from "../services/telegramBot";

export function setupTelegramWebhook(app: Express) {
  // Telegram webhook endpoint
  app.post('/webhook/telegram', async (req, res) => {
    try {
      // Process the incoming update from Telegram
      await handleTelegramUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling Telegram webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  });

  // Endpoint to set the webhook URL (for configuration)
  app.get('/webhook/telegram/setup', async (req, res) => {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN || '';
      const url = req.query.url as string;
      
      if (!token) {
        return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN environment variable is not set' });
      }
      
      if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
      }
      
      // Make a request to Telegram API to set the webhook
      const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}/webhook/telegram`);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error('Error setting up webhook:', error);
      res.status(500).json({ error: 'Failed to set up webhook' });
    }
  });
}
