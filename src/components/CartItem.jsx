import { useCart } from '../context/CartContext';

function CartItem({ item }) {
    const { updateQuantity, removeItem } = useCart();
    const qty = item.quantity;

    return (
        <div className="cart-item">
            <img src={item.image} alt={item.name} className="cart-item-image" />
            <div className="cart-item-details">
                <h4 className="cart-item-name">{item.name}</h4>
                <span className="cart-item-price">{item.price * qty}</span>
            </div>
            <div className="cart-item-controls">
                <div className="qty-controls-inline">
                    <button onClick={() => qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1)}>−</button>
                    <span className="qty-value">{qty}</span>
                    <button onClick={() => updateQuantity(item.id, qty + 1)}>+</button>
                </div>
                <button className="cart-item-remove" onClick={() => removeItem(item.id)} title="Remove">
                    ✕
                </button>
            </div>
        </div>
    );
}

export default CartItem;
