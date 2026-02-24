import { useState, useEffect, useMemo } from 'react';
import MenuItem from '../components/MenuItem';

const API_URL = '/api';

function MenuPage() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        fetch(`${API_URL}/menu`)
            .then(res => res.json())
            .then(data => {
                setMenu(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch menu:', err);
                setLoading(false);
            });
    }, []);

    const categories = useMemo(() => {
        const cats = ['All', ...new Set(menu.map(item => item.category))];
        return cats;
    }, [menu]);

    const filteredMenu = useMemo(() => {
        let filtered = menu;
        if (activeCategory !== 'All') {
            filtered = filtered.filter(item => item.category === activeCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                item =>
                    item.name.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [menu, activeCategory, search]);

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading delicious menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">🍛 Our Menu</h1>
                <p className="page-subtitle">
                    Discover {menu.length} handpicked dishes from across India
                </p>
            </div>

            <div className="menu-controls">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search for your favorite dish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="category-filters" style={{ marginBottom: '1.5rem' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredMenu.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No dishes found</h3>
                    <p>Try a different search or category</p>
                </div>
            ) : (
                <div className="menu-grid">
                    {filteredMenu.map(item => (
                        <MenuItem key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MenuPage;
