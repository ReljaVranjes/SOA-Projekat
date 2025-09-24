import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService, ShoppingCart, OrderItem } from '../services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: ShoppingCart | null;
  loading: boolean;
  addToCart: (tourID: string, tourName: string, price: number) => Promise<void>;
  removeFromCart: (tourID: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  checkout: () => Promise<{ message: string; order: any }>;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, refreshBalance } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated || user?.role !== 'Tourist') {
      setCart(null);
      return;
    }

    setLoading(true);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Initialize empty cart structure
      setCart({
        userID: user?.id || '',
        items: [],
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (tourID: string, tourName: string, price: number) => {
    try {
      const updatedCart = await cartService.addToCart(tourID, tourName, price);
      setCart(updatedCart);
      await refreshCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (tourID: string) => {
    try {
      const updatedCart = await cartService.removeFromCart(tourID);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart(prev => prev ? { ...prev, items: [], total: 0 } : null);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const checkout = async () => {
    try {
      const result = await cartService.checkout();
      // Refresh cart (should now be empty) and user balance
      await Promise.all([
        refreshCart(),
        refreshBalance()
      ]);
      return result;
    } catch (error) {
      console.error('Failed to checkout:', error);
      throw error;
    }
  };

  // Load cart when user authenticates
  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, user]);

  const itemCount = cart?.items?.length || 0;
  const totalPrice = cart?.total || 0;

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart,
    checkout,
    itemCount,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};