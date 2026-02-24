import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import MenuItem from '../components/MenuItem';

const mockItem = {
    id: 1,
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken pieces',
    price: 320,
    image: 'https://example.com/butter-chicken.jpg',
    category: 'Main Course',
};

function renderWithProviders(component) {
    return render(
        <BrowserRouter>
            <CartProvider>
                {component}
            </CartProvider>
        </BrowserRouter>
    );
}

describe('MenuItem', () => {
    it('renders food item name', () => {
        renderWithProviders(<MenuItem item={mockItem} />);
        expect(screen.getByText('Butter Chicken')).toBeInTheDocument();
    });

    it('renders food item description', () => {
        renderWithProviders(<MenuItem item={mockItem} />);
        expect(screen.getByText(/Creamy tomato-based curry/)).toBeInTheDocument();
    });

    it('renders food item price with rupee symbol', () => {
        renderWithProviders(<MenuItem item={mockItem} />);
        expect(screen.getByText('320')).toBeInTheDocument();
    });

    it('renders category badge', () => {
        renderWithProviders(<MenuItem item={mockItem} />);
        expect(screen.getByText('Main Course')).toBeInTheDocument();
    });

    it('renders Add button initially', () => {
        renderWithProviders(<MenuItem item={mockItem} />);
        expect(screen.getByText('+ Add')).toBeInTheDocument();
    });

    it('shows quantity controls after adding to cart', () => {
        renderWithProviders(<MenuItem item={mockItem} />);
        fireEvent.click(screen.getByText('+ Add'));
        // After adding, should show quantity controls with value 1
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
