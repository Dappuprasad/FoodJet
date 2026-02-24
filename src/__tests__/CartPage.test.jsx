import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import CartPage from '../pages/CartPage';

// Helper to add items to cart before rendering CartPage
function CartPageWithItems({ items }) {
    return (
        <BrowserRouter>
            <CartProvider>
                <CartSetup items={items} />
                <CartPage />
            </CartProvider>
        </BrowserRouter>
    );
}

function CartSetup({ items }) {
    const { addItem } = useCart();
    // Add items on first render
    if (items._added) return null;
    items._added = true;
    items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            addItem(item);
        }
    });
    return null;
}

const mockItems = [
    { id: 1, name: 'Butter Chicken', price: 320, image: 'test.jpg', quantity: 2 },
    { id: 2, name: 'Biryani', price: 280, image: 'test.jpg', quantity: 1 },
];

describe('CartPage', () => {
    it('shows empty state when cart is empty', () => {
        render(
            <BrowserRouter>
                <CartProvider>
                    <CartPage />
                </CartProvider>
            </BrowserRouter>
        );
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('shows Browse Menu link when cart is empty', () => {
        render(
            <BrowserRouter>
                <CartProvider>
                    <CartPage />
                </CartProvider>
            </BrowserRouter>
        );
        expect(screen.getByText(/Browse Menu/)).toBeInTheDocument();
    });

    it('renders cart items when items exist', () => {
        render(<CartPageWithItems items={[...mockItems]} />);
        expect(screen.getByText('Butter Chicken')).toBeInTheDocument();
        expect(screen.getByText('Biryani')).toBeInTheDocument();
    });

    it('shows correct item count in header', () => {
        render(<CartPageWithItems items={[...mockItems]} />);
        expect(screen.getByText(/3 item(s)? ready for checkout/)).toBeInTheDocument();
    });
});
