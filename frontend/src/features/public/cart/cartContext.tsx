"use client";
import React, { createContext, useContext, useState } from 'react';
import { ApiProduct, CartItem, ProductSize } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ApiProduct, quantity?: number, size?: ProductSize | null) => void;
  removeFromCart: (productId: string, size?: ProductSize | null) => void;
  updateQuantity: (productId: string, quantity: number, size?: ProductSize | null) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Unique key per product+size combo: requested format `${productId}__${size}`
const itemKey = (id: string, size?: ProductSize | null) => `${id}__${size ?? 'ONE_SIZE'}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: ApiProduct, quantity = 1, size?: ProductSize | null) => {
    const key = itemKey(product.id, size);
    const isExisting = items.some(item => itemKey(item.id, item.selectedSize) === key);

    if (isExisting) {
      toast({
        title: "Panier mis à jour",
        description: `Quantité de ${product.name} modifiée`,
      });
    } else {
      toast({
        title: `Ajouté au panier${size ? ` (Taille ${size})` : ''}`,
        description: `${product.name} ajouté à votre panier`,
      });
    }

    setItems(prev => {
      const existing = prev.find(item => itemKey(item.id, item.selectedSize) === key);
      if (existing) {
        return prev.map(item =>
          itemKey(item.id, item.selectedSize) === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { ...product, quantity, selectedSize: size ?? null }];
      }
    });
  };

  const removeFromCart = (productId: string, size?: ProductSize | null) => {
    const key = itemKey(productId, size);
    setItems(prev => prev.filter(item => itemKey(item.id, item.selectedSize) !== key));
    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };

  const updateQuantity = (productId: string, quantity: number, size?: ProductSize | null) => {
    if (quantity < 1) return;
    const key = itemKey(productId, size);
    setItems(prev => prev.map(item =>
      itemKey(item.id, item.selectedSize) === key ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
