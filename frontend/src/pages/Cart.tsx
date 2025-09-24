import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ROUTES } from '../constants/routes';

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, checkout, totalPrice, itemCount } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  const handleRemoveItem = async (tourID: string) => {
    try {
      await removeFromCart(tourID);
    } catch (error) {
      alert('Failed to remove item from cart');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        alert('Failed to clear cart');
      }
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);
    try {
      const result = await checkout();
      alert(`Checkout successful! Order ID: ${result.order.id}`);
      navigate(ROUTES.ORDERS);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Checkout failed';
      alert(`Checkout failed: ${errorMessage}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!cart) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <Link
          to={ROUTES.TOURS}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Continue Shopping
        </Link>
      </div>

      {itemCount === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some tours to get started!</p>
          <Link
            to={ROUTES.TOURS}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Tours
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Items in your cart ({itemCount})</h2>
              <div className="space-y-4">
                {cart.items.map((item, index) => {
                  return (
                    <div key={`${item.tourId}-${index}`} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.tourName}</h3>
                        <p className="text-sm text-gray-500">Tour ID: {item.tourId}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold text-blue-600">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            handleRemoveItem(item.tourId);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total ({itemCount} items):</span>
              <span className="text-2xl font-bold text-blue-600">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleClearCart}
                disabled={itemCount === 0}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Cart
              </button>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || itemCount === 0}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;