import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  description: string;
  size: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
}

interface CartContextType {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>({
    items: [],
    total: 0,
  });

  const calculateTotal = useCallback((items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setState((prevState) => {
      const existingItemIndex = prevState.items.findIndex((i) => i.id === item.id);
      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        newItems = prevState.items.map((i, index) =>
          index === existingItemIndex ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        // Add new item
        newItems = [...prevState.items, item];
      }

      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  }, [calculateTotal]);

  const removeItem = useCallback((itemId: string) => {
    setState((prevState) => {
      const newItems = prevState.items.filter((item) => item.id !== itemId);
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  }, [calculateTotal]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setState((prevState) => {
      const newItems = prevState.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  }, [removeItem, calculateTotal]);

  const clearCart = useCallback(() => {
    setState({
      items: [],
      total: 0,
    });
  }, []);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

