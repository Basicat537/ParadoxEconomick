import { Product } from "@shared/types";

interface ProductDetailProps {
  product: Product | null;
  onProceed: () => void;
  onBack: () => void;
}

export default function ProductDetail({ product, onProceed, onBack }: ProductDetailProps) {
  if (!product) return null;

  const discountedPrice = product.originalPrice ? (
    <span className="line-through text-dark-light">${product.originalPrice.toFixed(2)}</span>
  ) : null;

  return (
    <>
      <div className="self-end bg-white border rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">Buy {product.name}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h2 className="font-bold text-lg text-dark">{product.name}</h2>
        <p className="text-dark-light text-sm mb-3">{product.platform} / {product.region}</p>
        <p className="text-sm text-dark mb-3">{product.description}</p>
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-xl text-success">${product.price.toFixed(2)}</span>
          {discountedPrice}
        </div>
        <p className="text-xs text-dark-light mb-3">
          ✅ In stock: {product.stock} keys available
        </p>
        <button 
          className="w-full bg-accent text-white py-2 rounded font-medium"
          onClick={onProceed}
        >
          Proceed to Payment
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onBack}
        >
          🔙 Back to Games
        </button>
      </div>
    </>
  );
}
