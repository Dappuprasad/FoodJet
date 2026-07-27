import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { useCart } from '../context/cart-context';
import { useToast } from '../context/toast-context';

export function Navbar() {
  const { totalItems } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    notify('Signed out', 'info');
    void navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon" aria-hidden="true">
            🍛
          </span>
          <span className="brand-text">FoodJet</span>
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className="icon" aria-hidden="true">
              🍽️
            </span>
            <span>Menu</span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className="icon" aria-hidden="true">
              🛒
            </span>
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="cart-badge" aria-label={`${totalItems} items in cart`}>
                {totalItems}
              </span>
            )}
          </NavLink>

          {user && (
            <NavLink
              to="/orders"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="icon" aria-hidden="true">
                📦
              </span>
              <span>Orders</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="icon" aria-hidden="true">
                ⚙️
              </span>
              <span>Admin</span>
            </NavLink>
          )}

          {user ? (
            <div className="nav-user">
              <span className="nav-user-name" title={user.email}>
                {user.name.split(' ')[0]}
              </span>
              <button type="button" className="nav-signout" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => `nav-link nav-signin ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span>Sign in</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
