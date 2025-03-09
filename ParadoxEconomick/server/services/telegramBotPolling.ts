import { handleTelegramUpdate } from './telegramBot';

// Bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Function to get updates from Telegram
async function getUpdates(offset: number = 0, timeout: number = 30) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
    const params = new URLSearchParams({
      offset: offset.toString(),
      timeout: timeout.toString(),
      allowed_updates: JSON.stringify(['message', 'callback_query'])
    });

    const response = await fetch(`${url}?${params}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting updates:', error);
    return { ok: false, error: 'Failed to get updates' };
  }
}

// Function to start long polling
export async function startPolling() {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set. Cannot start bot polling.');
    return;
  }

  console.log('Starting Telegram bot polling...');
  let offset = 0;

  // Start the polling loop
  while (true) {
    try {
      const result = await getUpdates(offset);
      
      if (result.ok) {
        const updates = result.result;
        
        if (updates && updates.length > 0) {
          // Process each update
          for (const update of updates) {
            try {
              // Set the new offset to the update_id + 1
              offset = update.update_id + 1;
              
              // Handle the update
              await handleTelegramUpdate(update);
            } catch (error) {
              console.error(`Error processing update ${update.update_id}:`, error);
            }
          }
        }
      } else {
        console.error('Failed to get updates:', result.description);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Error in polling loop:', error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}