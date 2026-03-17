"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { MenuItemType } from "@/types";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  type: MenuItemType;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ tableId, children }: { tableId: string; children: ReactNode }) {
  const storageKey = `cart_${tableId}`;

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.menuItemId !== menuItemId);
      }
      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}
