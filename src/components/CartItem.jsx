import { useCart } from '../context/CartContext';

function CartItem({ item }) {
    const { updateQuantity, removeItem } = useCart();

    return (
        <div className="cart-item">
            <img
                className="cart-item-image"
                src={item.image}
                alt={item.name}
                onError={(e) => {
                    e.target.src = `https://placehold.co/200x200/1a1a2e/ff6b35?text=${encodeURIComponent(item.name)}`;
                }}
            />
            <div className="cart-item-details">
                <h4 className="cart-item-name">{item.name}</h4>
                <span className="cart-item-price">{item.price}</span>
            </div>
            <div className="cart-item-controls">
                <div className="qty-controls-inline">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}

export default CartItem;
