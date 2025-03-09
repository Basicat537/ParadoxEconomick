import { Order } from "@shared/types";

interface UserAccountProps {
  orders: Order[];
  onBack: () => void;
}

export default function UserAccount({ orders, onBack }: UserAccountProps) {
  // Mock user data
  const user = {
    name: "John Doe",
    username: "johndoe",
    cashback: 5.75
  };

  return (
    <>
      <div className="self-end bg-white border rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">My Account</p>
      </div>
      
      <div className="bg-telegram-light rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">👤 Your Account Information:</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 bg-telegram rounded-full flex items-center justify-center text-white font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="ml-3">
            <h3 className="font-bold text-dark">{user.name}</h3>
            <p className="text-dark-light text-sm">@{user.username}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-100 rounded mb-3">
          <span className="text-dark">Cashback Balance:</span>
          <span className="font-bold text-green-500">${user.cashback.toFixed(2)}</span>
        </div>
        
        <h4 className="font-bold text-dark mb-2">Recent Orders:</h4>
        
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="border-b py-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{order.productName}</span>
                <span className="text-sm text-green-500">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-dark-light">
                <span>Order #{order.id}</span>
                <span>{new Date(order.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-dark-light py-3">No orders yet.</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
        >
          📋 All Orders
        </button>
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onBack}
        >
          🏠 Main Menu
        </button>
      </div>
    </>
  );
}
