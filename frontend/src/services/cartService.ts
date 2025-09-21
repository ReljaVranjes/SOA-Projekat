import api from '../api';

export interface OrderItem {
  tourId: string;
  tourName: string;
  price: number;
}

export interface ShoppingCart {
  userID: string;
  items: OrderItem[];
  total: number;
}

export interface Order {
  id: string;
  userID: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

const prefix = '/api/payment-service';

export const cartService = {
  // Shopping Cart operations
  getCart: async (): Promise<ShoppingCart> => {
    const response = await api.get(`${prefix}/cart`);
    return response.data;
  },

  addToCart: async (tourID: string, tourName: string, price: number): Promise<ShoppingCart> => {
    const response = await api.post(`${prefix}/cart/items`, {
      tourID,
      tourName,
      price
    });
    return response.data;
  },

  removeFromCart: async (tourID: string): Promise<ShoppingCart> => {
    const response = await api.delete(`${prefix}/cart/items/${tourID}`);
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete(`${prefix}/cart`);
  },

  // Checkout
  checkout: async (): Promise<{ message: string; order: Order }> => {
    const response = await api.post(`${prefix}/checkout`);
    return response.data;
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get(`${prefix}/orders`);
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await api.get(`${prefix}/orders/${orderId}`);
    return response.data;
  },
};