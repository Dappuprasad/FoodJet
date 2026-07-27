import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page page-top">
      <div className="empty-state fade-in">
        <div className="empty-icon">🍽️</div>
        <h3>Page not found</h3>
        <p>That link led somewhere that does not exist.</p>
        <Link to="/" className="browse-menu-btn">
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
