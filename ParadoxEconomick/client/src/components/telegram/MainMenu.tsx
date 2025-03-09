import { BotView } from "./TelegramBot";

interface MainMenuProps {
  onSelectView: (view: BotView) => void;
}

export default function MainMenu({ onSelectView }: MainMenuProps) {
  return (
    <>
      <div className="bg-telegram-light rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">What would you like to do today?</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={() => onSelectView("categories")}
        >
          🛒 Catalog
        </button>
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={() => onSelectView("account")}
        >
          👤 My Account
        </button>
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={() => onSelectView("categories")}
        >
          💎 Minecraft Donates
        </button>
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={() => onSelectView("support")}
        >
          ❓ Support
        </button>
      </div>
    </>
  );
}
