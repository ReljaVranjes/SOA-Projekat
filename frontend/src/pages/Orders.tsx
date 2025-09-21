import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartService, Order } from '../services/cartService';
import { ROUTES } from '../constants/routes';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const ordersData = await cartService.getOrders();
        // Filter out any null/undefined orders and ensure items array exists
        const validOrders = (ordersData || []).filter(order =>
          order &&
          typeof order === 'object' &&
          order.id
        ).map(order => ({
          ...order,
          items: order.items || []
        }));
        setOrders(validOrders);
      } catch (err: any) {
        setError('Failed to load orders');
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Purchase History</h1>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Purchase History</h1>
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Orders</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
        <Link
          to={ROUTES.TOURS}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Browse More Tours →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Your purchase history will appear here once you make your first order.</p>
          <Link
            to={ROUTES.TOURS}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.filter(order => order && order.id).map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      ${(order.total || 0).toFixed(2)}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {(order.status || 'unknown').charAt(0).toUpperCase() + (order.status || 'unknown').slice(1)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Items ({order.items?.length || 0}):
                  </h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={`${item.tourId}-${index}`} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.tourName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            (Tour ID: {item.tourId})
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    )) || <p className="text-sm text-gray-500">No items in this order</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;