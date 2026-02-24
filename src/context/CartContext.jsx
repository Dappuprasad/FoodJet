import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    }, []);

    const addItem = useCallback((menuItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === menuItem.id);
            if (existing) {
                return prev.map(i =>
                    i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...menuItem, quantity: 1 }];
        });
        showToast(`${menuItem.name} added to cart!`);
    }, [showToast]);

    const removeItem = useCallback((id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const updateQuantity = useCallback((id, quantity) => {
        if (quantity < 1) {
            setItems(prev => prev.filter(i => i.id !== id));
            return;
        }
        setItems(prev =>
            prev.map(i => (i.id === id ? { ...i, quantity } : i))
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice,
            toast,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
