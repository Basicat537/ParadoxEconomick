import { useState } from "react";
import { Card } from "@/components/ui/card";
import MainMenu from "./MainMenu";
import Catalog from "./Catalog";
import ProductDetail from "./ProductDetail";
import Payment from "./Payment";
import UserAccount from "./UserAccount";
import Support from "./Support";
import { Product, Category, PaymentMethod, Order } from "@shared/types";
import { useToast } from "@/hooks/use-toast";

export type BotView = 
  | "main"
  | "catalog"
  | "categories"
  | "productDetail"
  | "payment"
  | "cryptoPayment"
  | "orderComplete"
  | "account"
  | "support";

interface TelegramBotProps {
  categories: Category[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
}

export default function TelegramBot({ 
  categories, 
  products, 
  paymentMethods,
  orders 
}: TelegramBotProps) {
  const [view, setView] = useState<BotView>("main");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [message, setMessage] = useState<string>("");
  const { toast } = useToast();

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setView("catalog");
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setView("productDetail");
  };

  const handlePaymentSelect = () => {
    setView("payment");
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setView("cryptoPayment");
  };

  const handleConfirmPayment = () => {
    // In a real app, this would verify the payment with the backend
    toast({
      title: "Payment confirmed",
      description: "Your order has been processed successfully.",
    });
    setView("orderComplete");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    toast({
      title: "Message sent",
      description: "We'll get back to you shortly.",
    });
    setMessage("");
  };

  const renderView = () => {
    switch (view) {
      case "main":
        return <MainMenu onSelectView={setView} />;
      case "categories":
        return <Catalog 
          categories={categories} 
          onSelectCategory={handleCategorySelect} 
          onBack={() => setView("main")} 
          viewType="categories"
        />;
      case "catalog":
        return <Catalog 
          categories={categories}
          products={products.filter(p => p.categoryId === selectedCategory?.id)} 
          onSelectProduct={handleProductSelect}
          onBack={() => setView("categories")} 
          selectedCategory={selectedCategory}
          viewType="products"
        />;
      case "productDetail":
        return <ProductDetail 
          product={selectedProduct} 
          onProceed={handlePaymentSelect} 
          onBack={() => setView("catalog")} 
        />;
      case "payment":
        return <Payment 
          product={selectedProduct} 
          paymentMethods={paymentMethods} 
          onSelectPaymentMethod={handlePaymentMethodSelect} 
          onBack={() => setView("productDetail")} 
        />;
      case "cryptoPayment":
        return <Payment 
          product={selectedProduct} 
          paymentMethod={selectedPaymentMethod} 
          onConfirmPayment={handleConfirmPayment} 
          onBack={() => setView("payment")} 
          viewType="crypto"
        />;
      case "orderComplete":
        return <Payment 
          product={selectedProduct} 
          viewType="complete" 
          onBack={() => setView("main")} 
        />;
      case "account":
        return <UserAccount orders={orders} onBack={() => setView("main")} />;
      case "support":
        return <Support 
          message={message} 
          setMessage={setMessage} 
          onSendMessage={handleSendMessage} 
          onBack={() => setView("main")} 
        />;
      default:
        return <MainMenu onSelectView={setView} />;
    }
  };

  return (
    <div className="telegram-container max-w-md mx-auto mb-8 bg-white rounded-lg shadow-md">
      <div className="bg-telegram text-white p-4 rounded-t-lg flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2a9.98 9.98 0 017.995 4H4.005A9.98 9.98 0 0112 2zm-8.45 6h16.9A9.97 9.97 0 0122 12c0 1.47-.322 2.87-.9 4.13L14.13 12l6.97-4.13A9.97 9.97 0 0112 2a9.97 9.97 0 01-8.45 6zm-.55 1.9V22a9.98 9.98 0 009-9H3zm11 9a9.98 9.98 0 009-9v10.9A9.98 9.98 0 0114 22z" />
        </svg>
        <h1 className="text-xl font-bold">GameStore Bot</h1>
      </div>
      
      <div className="h-[600px] overflow-y-auto p-4 flex flex-col gap-4">
        <div className="bg-telegram-light rounded-lg p-3 max-w-[85%]">
          <p className="font-roboto">👋 Welcome to GameStore Bot! Buy games, subscriptions, and server upgrades with ease.</p>
        </div>
        
        {renderView()}
      </div>
      
      <div className="border-t p-3 flex items-center">
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="flex-1 border rounded-full py-2 px-4 mr-2 text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        <button 
          className="bg-telegram text-white w-10 h-10 rounded-full flex items-center justify-center"
          onClick={handleSendMessage}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
