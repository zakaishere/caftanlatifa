import { useState, useEffect } from 'react';

const STORAGE_KEY = 'my_tracked_orders';

export function useMyOrders() {
    const [orderIds, setOrderIds] = useState<string[]>([]);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setOrderIds(JSON.parse(stored));
            }
        } catch (err) {
            console.error('Failed to load tracked orders:', err);
        }
    }, []);

    // Save an order ID if it doesn't already exist
    const trackOrder = (orderId: string) => {
        setOrderIds(prev => {
            if (prev.includes(orderId)) return prev;
            const updated = [orderId, ...prev];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (err) {
                console.error('Failed to save tracked order:', err);
            }
            return updated;
        });
    };

    // Remove an order ID from tracking
    const untrackOrder = (orderId: string) => {
        setOrderIds(prev => {
            const updated = prev.filter(id => id !== orderId);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (err) {
                console.error('Failed to update tracked orders:', err);
            }
            return updated;
        });
    };

    return {
        orderIds,
        trackOrder,
        untrackOrder,
    };
}
