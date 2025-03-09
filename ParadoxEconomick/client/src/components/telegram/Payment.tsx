import { PaymentMethod, Product } from "@shared/types";

interface PaymentProps {
  product: Product | null;
  paymentMethods?: PaymentMethod[];
  paymentMethod?: PaymentMethod | null;
  viewType?: "select" | "crypto" | "complete";
  onSelectPaymentMethod?: (method: PaymentMethod) => void;
  onConfirmPayment?: () => void;
  onBack: () => void;
}

export default function Payment({ 
  product, 
  paymentMethods = [], 
  paymentMethod,
  viewType = "select",
  onSelectPaymentMethod,
  onConfirmPayment,
  onBack 
}: PaymentProps) {
  if (!product) return null;

  const renderPaymentSelection = () => (
    <>
      <div className="self-end bg-white border rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">Proceed to payment</p>
      </div>
      
      <div className="bg-telegram-light rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">Please select your payment method:</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <h3 className="font-bold text-dark mb-2">Payment for: {product.name}</h3>
        <p className="text-dark-light text-sm mb-3">Amount: ${product.price.toFixed(2)}</p>
        
        <div className="space-y-2 mb-3">
          {paymentMethods.map((method) => (
            <div 
              key={method.id}
              className="flex items-center p-2 border rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelectPaymentMethod && onSelectPaymentMethod(method)}
            >
              <div className="text-xl mr-2" dangerouslySetInnerHTML={{ __html: method.icon }} />
              <span>{method.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onBack}
        >
          🔙 Back to Product
        </button>
      </div>
    </>
  );

  const renderCryptoPayment = () => (
    <>
      <div className="self-end bg-white border rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">Pay with {paymentMethod?.name}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <h3 className="font-bold text-dark mb-2">USDT (TRC20) Payment</h3>
        <p className="text-dark-light text-sm mb-3">
          Please send <span className="font-bold">{product.price.toFixed(2)} USDT</span> to the address below:
        </p>
        
        <div className="bg-gray-100 p-3 rounded mb-3 text-center break-all">
          <p className="text-sm font-mono select-all">TWJk7hy8NHnZ5F9ZGKXfpBD4dQr75ZJPx1</p>
        </div>
        
        <div className="flex justify-center mb-3">
          <div className="bg-white p-2 border rounded">
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-dark mb-3">
          Your order will be processed automatically after payment confirmation (1-3 confirmations required).
        </p>
        
        <div className="flex items-center justify-center p-2 bg-yellow-100 text-yellow-800 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Waiting for payment... (15:00 left)</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onBack}
        >
          🔙 Change Method
        </button>
        <button 
          className="bg-green-500 text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onConfirmPayment}
        >
          ✅ I've Paid
        </button>
      </div>
    </>
  );

  const renderOrderComplete = () => (
    <>
      <div className="bg-green-100 rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">✅ Payment confirmed! Here is your purchase:</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <div className="flex items-center justify-center mb-3 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="font-bold text-dark text-center mb-2">{product.name}</h3>
        <p className="text-center text-dark-light text-sm mb-3">{product.platform} / {product.region}</p>
        
        <div className="bg-gray-100 p-3 rounded mb-3">
          <p className="font-mono text-sm text-center break-all select-all">XXXX-YYYY-ZZZZ-AAAA-BBBB</p>
        </div>
        
        <div className="space-y-2 mb-3">
          <p className="text-sm text-dark"><strong>Activation:</strong> Open Steam → Games → Activate a Product on Steam</p>
          <p className="text-sm text-dark"><strong>Order ID:</strong> #{Math.floor(100000 + Math.random() * 900000)}</p>
          <p className="text-sm text-dark"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-telegram text-white py-2 rounded font-medium text-sm">
            Save Key
          </button>
          <button className="flex-1 bg-accent text-white py-2 rounded font-medium text-sm">
            Support
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onBack}
        >
          🏠 Back to Main Menu
        </button>
      </div>
    </>
  );

  if (viewType === "crypto") {
    return renderCryptoPayment();
  } else if (viewType === "complete") {
    return renderOrderComplete();
  }
  
  return renderPaymentSelection();
}
