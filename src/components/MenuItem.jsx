import { useCart } from '../context/CartContext';
import { useState } from 'react';

function MenuItem({ item }) {
    const { items, addItem, updateQuantity } = useCart();
    const [justAdded, setJustAdded] = useState(false);

    const cartItem = items.find(i => i.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = () => {
        addItem(item);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1000);
    };

    return (
        <div className="menu-card" data-testid={`menu-item-${item.id}`}>
            <div className="menu-card-image-wrapper">
                <img
                    className="menu-card-image"
                    src={item.image}
                    alt={item.name}
                    onError={(e) => {
                        e.target.src = `https://placehold.co/400x300/1a1a2e/ff6b35?text=${encodeURIComponent(item.name)}`;
                    }}
                />
                <span className="menu-card-category">{item.category}</span>
            </div>
            <div className="menu-card-body">
                <h3 className="menu-card-name">{item.name}</h3>
                <p className="menu-card-desc">{item.description}</p>
                <div className="menu-card-footer">
                    <span className="menu-card-price">{item.price}</span>
                    {quantity === 0 ? (
                        <button
                            className={`add-to-cart-btn ${justAdded ? 'added' : ''}`}
                            onClick={handleAdd}
                        >
                            {justAdded ? '✓ Added' : '+ Add'}
                        </button>
                    ) : (
                        <div className="qty-controls-inline">
                            <button onClick={() => updateQuantity(item.id, quantity - 1)}>−</button>
                            <span className="qty-value">{quantity}</span>
                            <button onClick={() => updateQuantity(item.id, quantity + 1)}>+</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MenuItem;
