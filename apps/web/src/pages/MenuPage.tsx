import { useMemo, useState } from 'react';
import { MenuCard } from '../components/MenuCard';
import { Spinner } from '../components/Spinner';
import { useMenu } from '../hooks/useMenu';

const ALL_CATEGORIES = 'All';

export function MenuPage() {
  const { items, categories, isLoading, error } = useMenu();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [vegOnly, setVegOnly] = useState(false);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (activeCategory !== ALL_CATEGORIES && item.category !== activeCategory) {
        return false;
      }
      if (vegOnly && !item.isVegetarian) return false;
      if (!query) return true;

      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [items, activeCategory, search, vegOnly]);

  if (isLoading) {
    return (
      <div className="page">
        <Spinner label="Loading the menu..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state fade-in">
          <div className="empty-icon">📡</div>
          <h3>Menu unavailable</h3>
          <p>{error}</p>
          <button
            type="button"
            className="browse-menu-btn"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="hero-badge">
          <span className="pulse-dot" />
          Now delivering across India
        </div>
        <h1 className="hero-title">
          Authentic Indian
          <br />
          <span className="highlight">flavors delivered</span>
        </h1>
        <p className="hero-subtitle">
          Handpicked dishes cooked to order — from slow-simmered biryanis to
          street-side samosas, tracked live from our kitchen to your door.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{items.length}</span>
            <span className="hero-stat-label">Dishes</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">30 min</span>
            <span className="hero-stat-label">Avg delivery</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">4.9★</span>
            <span className="hero-stat-label">Rating</span>
          </div>
        </div>
      </section>

      <div className="page">
        <div className="menu-controls">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search for biryani, dosa, paneer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search the menu"
            />
          </div>

          <label className="veg-toggle">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(event) => setVegOnly(event.target.checked)}
            />
            <span>Vegetarian only</span>
          </label>
        </div>

        <div className="category-filters">
          {[ALL_CATEGORIES, ...categories].map((category) => (
            <button
              key={category}
              type="button"
              className={`category-pill ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No dishes found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div className="menu-grid">
            {visibleItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
