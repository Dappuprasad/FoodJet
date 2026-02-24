import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import CheckoutPage from '../pages/CheckoutPage';

function CheckoutWithItems({ items }) {
    return (
        <BrowserRouter>
            <CartProvider>
                <CartSetup items={items} />
                <CheckoutPage />
            </CartProvider>
        </BrowserRouter>
    );
}

function CartSetup({ items }) {
    const { addItem } = useCart();
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
    { id: 1, name: 'Butter Chicken', price: 320, image: 'test.jpg', quantity: 1 },
];

describe('CheckoutPage', () => {
    it('shows empty state when cart is empty', () => {
        render(
            <BrowserRouter>
                <CartProvider>
                    <CheckoutPage />
                </CartProvider>
            </BrowserRouter>
        );
        expect(screen.getByText('No items in cart')).toBeInTheDocument();
    });

    it('renders delivery form when cart has items', () => {
        render(<CheckoutWithItems items={[...mockItems]} />);
        expect(screen.getByText('Delivery Details')).toBeInTheDocument();
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Delivery Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', () => {
        render(<CheckoutWithItems items={[...mockItems]} />);
        const submitBtn = screen.getByRole('button', { name: /Place Order/i });
        fireEvent.click(submitBtn);

        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Address is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    it('shows validation error for invalid phone number', () => {
        render(<CheckoutWithItems items={[...mockItems]} />);

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Delivery Address/i), { target: { value: 'Address' } });
        fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '12345' } });

        const submitBtn = screen.getByRole('button', { name: /Place Order/i });
        fireEvent.click(submitBtn);

        expect(screen.getByText('Enter a valid 10-digit phone number')).toBeInTheDocument();
    });

    it('renders order summary with item name', () => {
        render(<CheckoutWithItems items={[...mockItems]} />);
        expect(screen.getByText('Butter Chicken')).toBeInTheDocument();
    });
});
