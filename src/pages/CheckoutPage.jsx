import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API_URL = '/api';

function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', address: '', phone: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const deliveryFee = totalPrice >= 500 ? 0 : 40;
    const taxes = Math.round(totalPrice * 0.05);
    const grandTotal = totalPrice + deliveryFee + taxes;

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.address.trim()) errs.address = 'Address is required';
        if (!form.phone.trim()) errs.phone = 'Phone number is required';
        else if (!/^[0-9]{10}$/.test(form.phone.trim())) errs.phone = 'Enter a valid 10-digit phone number';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    address: form.address.trim(),
                    phone: form.phone.trim(),
                    items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.errors?.join(', ') || 'Failed to place order');
                setSubmitting(false);
                return;
            }

            const order = await res.json();
            clearCart();
            navigate(`/track/${order.id}`);
        } catch (err) {
            alert('Network error. Please try again.');
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="page">
                <div className="empty-state fade-in">
                    <div className="empty-icon">🛒</div>
                    <h3>No items in cart</h3>
                    <p>Add some delicious items first!</p>
                    <Link to="/" className="browse-menu-btn">🍽️ Browse Menu</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">📦 Checkout</h1>
                <p className="page-subtitle">Enter your delivery details</p>
            </div>

            <div className="checkout-layout">
                <form className="checkout-form" onSubmit={handleSubmit}>
                    <h3 className="form-title">Delivery Details</h3>

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={errors.name ? 'error' : ''}
                        />
                        {errors.name && <div className="form-error">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Delivery Address</label>
                        <textarea
                            id="address"
                            placeholder="Enter your complete delivery address"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className={errors.address ? 'error' : ''}
                        />
                        {errors.address && <div className="form-error">{errors.address}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            id="phone"
                            type="tel"
                            placeholder="10-digit phone number"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <div className="form-error">{errors.phone}</div>}
                    </div>

                    <button
                        type="submit"
                        className="place-order-btn"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                                Placing Order...
                            </>
                        ) : (
                            <>🚀 Place Order — ₹{grandTotal}</>
                        )}
                    </button>
                </form>

                <div className="order-summary">
                    <h3 className="order-summary-title">Your Order</h3>
                    {items.map(item => (
                        <div key={item.id} className="order-summary-item">
                            <div>
                                <span className="item-name">{item.name}</span>
                                <span className="item-qty"> × {item.quantity}</span>
                            </div>
                            <span>₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div className="cart-summary-row total" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <span className="label">Total</span>
                        <span className="value">₹{grandTotal}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
