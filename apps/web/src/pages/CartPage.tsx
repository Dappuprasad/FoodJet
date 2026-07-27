import { Link } from 'react-router-dom';
import { CartLineItem } from '../components/CartLineItem';
import { PriceSummary } from '../components/PriceSummary';
import { useCart } from '../context/cart-context';

export function CartPage() {
  const { lines, totalItems, pricing } = useCart();

  if (lines.length === 0) {
    return (
      <div className="page page-top">
        <div className="empty-state fade-in">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Nothing here yet — go find something good.</p>
          <Link to="/" className="browse-menu-btn">
            🍽️ Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-top fade-in">
      <div className="page-header">
        <h1 className="page-title">🛒 Your cart</h1>
        <p className="page-subtitle">
          {totalItems} item{totalItems === 1 ? '' : 's'} ready for checkout
        </p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {lines.map((line) => (
            <CartLineItem key={line.menuItemId} line={line} />
          ))}
        </div>

        <aside className="cart-summary">
          <h2 className="cart-summary-title">Order summary</h2>
          <PriceSummary pricing={pricing} itemCount={totalItems} />
          <Link to="/checkout" className="checkout-btn">
            Proceed to checkout →
          </Link>
        </aside>
      </div>
    </div>
  );
}
