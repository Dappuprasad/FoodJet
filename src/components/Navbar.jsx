import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
    const { totalItems } = useCart();
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="logo-icon">🚀</span>
                    <span>FoodJet</span>
                </Link>
                <div className="navbar-links">
                    <Link
                        to="/"
                        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        <span className="icon">🍽️</span>
                        <span>Menu</span>
                    </Link>
                    <Link
                        to="/cart"
                        className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
                    >
                        <span className="icon">🛒</span>
                        <span>Cart</span>
                        {totalItems > 0 && (
                            <span className="cart-badge">{totalItems}</span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
