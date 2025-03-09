import { useState } from "react";
import ProductManagement from "./ProductManagement";
import { Product, Category } from "@shared/types";

interface DashboardProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
}

type AdminView = "products" | "statistics" | "users" | "promotions" | "settings";

export default function Dashboard({ 
  products, 
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: DashboardProps) {
  const [activeView, setActiveView] = useState<AdminView>("products");

  const renderView = () => {
    switch (activeView) {
      case "products":
        return (
          <ProductManagement 
            products={products} 
            categories={categories}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
          />
        );
      case "statistics":
        return <div className="p-4">Statistics view is under development</div>;
      case "users":
        return <div className="p-4">Users management is under development</div>;
      case "promotions":
        return <div className="p-4">Promotions management is under development</div>;
      case "settings":
        return <div className="p-4">Settings is under development</div>;
      default:
        return <ProductManagement 
          products={products} 
          categories={categories}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
        />;
    }
  };

  return (
    <div className="admin-container mx-auto bg-white rounded-lg shadow-md">
      <div className="bg-dark text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <h1 className="text-xl font-bold">GameStore Bot Admin</h1>
        </div>
        <div className="flex items-center">
          <span className="mr-4">Admin User</span>
          <button className="bg-red-500 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </div>
      
      <div className="flex h-[600px]">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 p-4 flex flex-col">
          <div className="space-y-1">
            <button 
              className={`w-full flex items-center p-2 rounded ${activeView === 'products' ? 'bg-telegram text-white' : 'text-dark hover:bg-telegram-light'} font-medium`}
              onClick={() => setActiveView("products")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products</span>
            </button>
            <button 
              className={`w-full flex items-center p-2 rounded ${activeView === 'statistics' ? 'bg-telegram text-white' : 'text-dark hover:bg-telegram-light'} font-medium`}
              onClick={() => setActiveView("statistics")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Statistics</span>
            </button>
            <button 
              className={`w-full flex items-center p-2 rounded ${activeView === 'users' ? 'bg-telegram text-white' : 'text-dark hover:bg-telegram-light'} font-medium`}
              onClick={() => setActiveView("users")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Users</span>
            </button>
            <button 
              className={`w-full flex items-center p-2 rounded ${activeView === 'promotions' ? 'bg-telegram text-white' : 'text-dark hover:bg-telegram-light'} font-medium`}
              onClick={() => setActiveView("promotions")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Promotions</span>
            </button>
            <button 
              className={`w-full flex items-center p-2 rounded ${activeView === 'settings' ? 'bg-telegram text-white' : 'text-dark hover:bg-telegram-light'} font-medium`}
              onClick={() => setActiveView("settings")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
          
          <div className="mt-auto p-3 bg-white rounded shadow">
            <h3 className="font-bold text-dark text-sm mb-1">System Status</h3>
            <div className="flex items-center text-xs text-green-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Bot: Online</span>
            </div>
            <div className="flex items-center text-xs text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Payments: Working</span>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
