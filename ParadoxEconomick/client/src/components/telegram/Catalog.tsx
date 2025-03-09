import { Category, Product } from "@shared/types";
import { useState } from "react";

interface CatalogProps {
  viewType: "categories" | "products";
  categories: Category[];
  products?: Product[];
  selectedCategory?: Category | null;
  onSelectCategory?: (category: Category) => void;
  onSelectProduct?: (product: Product) => void;
  onBack: () => void;
}

export default function Catalog({ 
  viewType, 
  categories, 
  products, 
  selectedCategory,
  onSelectCategory, 
  onSelectProduct, 
  onBack 
}: CatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2; // Show 2 items per page
  
  let filteredProducts: Product[] = [];
  
  if (viewType === "products" && products) {
    filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Calculate pagination
  const totalPages = Math.ceil((filteredProducts.length || 1) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <>
      <div className="self-end bg-white border rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">
          {viewType === "categories" ? "Show me the catalog" : selectedCategory?.name}
        </p>
      </div>
      
      <div className="bg-telegram-light rounded-lg p-3 max-w-[85%]">
        {viewType === "categories" ? (
          <p className="font-roboto">Please select a category:</p>
        ) : (
          <>
            <p className="font-roboto">Here are the available {selectedCategory?.name} games:</p>
            <div className="mt-2">
              <input 
                type="text" 
                placeholder="Search games..." 
                className="w-full p-2 rounded border border-gray-300 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset pagination when searching
                }}
              />
            </div>
          </>
        )}
      </div>
      
      {viewType === "categories" ? (
        <div className="grid grid-cols-2 gap-2 w-full my-2">
          {categories.map(category => (
            <button 
              key={category.id}
              className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
              onClick={() => onSelectCategory && onSelectCategory(category)}
            >
              {category.icon} {category.name}
            </button>
          ))}
          <button 
            className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium col-span-2"
            onClick={onBack}
          >
            🏠 Back to Menu
          </button>
        </div>
      ) : (
        <>
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm p-3 w-full">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-dark">{product.name}</h3>
                    <p className="text-dark-light text-sm">{product.platform} / {product.region}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-success">${product.price.toFixed(2)}</span>
                      <button 
                        className="bg-accent text-white py-1 px-3 rounded text-sm font-medium"
                        onClick={() => onSelectProduct && onSelectProduct(product)}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg p-3 w-full text-center">
              <p className="text-dark-light">No games found. Try a different search term.</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 w-full my-2">
            <button 
              className={`bg-telegram text-white py-2 px-4 rounded text-sm font-medium ${currentPage === 1 ? 'opacity-50' : ''}`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              ◀️ Previous
            </button>
            <button 
              className={`bg-telegram text-white py-2 px-4 rounded text-sm font-medium ${currentPage === totalPages ? 'opacity-50' : ''}`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next ▶️
            </button>
            <button 
              className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium col-span-2"
              onClick={onBack}
            >
              🔙 Back to Categories
            </button>
          </div>
        </>
      )}
    </>
  );
}
