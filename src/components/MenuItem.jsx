import { useState } from 'react';
import { useCart } from '../context/CartContext';

function MenuItem({ item }) {
    const { items, addItem, updateQuantity, removeItem } = useCart();
    const [imgError, setImgError] = useState(false);

    const cartItem = items.find(i => i.id === item.id);
    const qty = cartItem ? cartItem.quantity : 0;

    const handleAdd = () => {
        addItem(item);
    };

    return (
        <div className="menu-card">
            <div className="menu-card-image-wrapper">
                {!imgError ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="menu-card-image"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div
                        className="menu-card-image"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                            fontSize: '3rem',
                        }}
                    >
                        🍛
                    </div>
                )}
                <span className="menu-card-category">{item.category}</span>
            </div>
            <div className="menu-card-body">
                <h3 className="menu-card-name">{item.name}</h3>
                <p className="menu-card-desc">{item.description}</p>
                <div className="menu-card-footer">
                    <span className="menu-card-price">{item.price}</span>
                    {qty === 0 ? (
                        <button className="add-to-cart-btn" onClick={handleAdd}>
                            + Add
                        </button>
                    ) : (
                        <div className="qty-controls-inline">
                            <button onClick={() => qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)}>−</button>
                            <span className="qty-value">{qty}</span>
                            <button onClick={() => updateQuantity(item.id, qty + 1)}>+</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MenuItem;
