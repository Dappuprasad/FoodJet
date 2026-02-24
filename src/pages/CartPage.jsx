import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

function CartPage() {
    const { items, totalPrice, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="page">
                <div className="empty-state fade-in">
                    <div className="empty-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any delicious items yet!</p>
                    <Link to="/" className="browse-menu-btn">
                        🍽️ Browse Menu
                    </Link>
                </div>
            </div>
        );
    }

    const deliveryFee = totalPrice >= 500 ? 0 : 40;
    const taxes = Math.round(totalPrice * 0.05);
    const grandTotal = totalPrice + deliveryFee + taxes;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">🛒 Your Cart</h1>
                <p className="page-subtitle">{totalItems} item{totalItems > 1 ? 's' : ''} in your cart</p>
            </div>

            <div className="cart-layout">
                <div className="cart-items">
                    {items.map(item => (
                        <CartItem key={item.id} item={item} />
                    ))}
                </div>

                <div className="cart-summary">
                    <h3 className="cart-summary-title">Order Summary</h3>
                    <div className="cart-summary-row">
                        <span className="label">Subtotal</span>
                        <span>₹{totalPrice}</span>
                    </div>
                    <div className="cart-summary-row">
                        <span className="label">Delivery Fee</span>
                        <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                    </div>
                    <div className="cart-summary-row">
                        <span className="label">Taxes (5%)</span>
                        <span>₹{taxes}</span>
                    </div>
                    {deliveryFee === 0 && (
                        <div className="cart-summary-row" style={{ color: 'var(--success)', fontSize: '0.8rem' }}>
                            <span>🎉 Free delivery on orders above ₹500!</span>
                        </div>
                    )}
                    <div className="cart-summary-row total">
                        <span className="label">Total</span>
                        <span className="value">₹{grandTotal}</span>
                    </div>
                    <Link to="/checkout" className="checkout-btn">
                        Proceed to Checkout →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
