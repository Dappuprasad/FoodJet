import { useState } from 'react';
import type { MenuItem } from '@foodjet/shared';
import { useCart } from '../context/cart-context';
import { useToast } from '../context/toast-context';
import { formatPaise } from '../lib/format';

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const { add, setQuantity, remove, quantityOf } = useCart();
  const { notify } = useToast();
  const [imageFailed, setImageFailed] = useState(false);

  const quantity = quantityOf(item.id);

  const handleAdd = () => {
    add(item);
    notify(`${item.name} added to cart`);
  };

  return (
    <article className="menu-card">
      <div className="menu-card-image-wrapper">
        {imageFailed ? (
          <div className="menu-card-image menu-card-image-fallback" aria-hidden="true">
            🍛
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="menu-card-image"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="menu-card-category">{item.category}</span>
        {item.isVegetarian && (
          <span className="menu-card-veg" title="Vegetarian" aria-label="Vegetarian">
            🟢
          </span>
        )}
      </div>

      <div className="menu-card-body">
        <div className="menu-card-heading">
          <h3 className="menu-card-name">{item.name}</h3>
          <span className="menu-card-rating" aria-label={`Rated ${item.rating} out of 5`}>
            ★ {item.rating.toFixed(1)}
          </span>
        </div>

        <p className="menu-card-desc">{item.description}</p>

        <div className="menu-card-meta">
          <span>🕒 {item.preparationMinutes} min</span>
          {item.spiceLevel > 0 && (
            <span aria-label={`Spice level ${item.spiceLevel} of 3`}>
              {'🌶️'.repeat(item.spiceLevel)}
            </span>
          )}
        </div>

        <div className="menu-card-footer">
          <span className="menu-card-price">{formatPaise(item.pricePaise)}</span>

          {quantity === 0 ? (
            <button
              type="button"
              className="add-to-cart-btn"
              onClick={handleAdd}
              aria-label={`Add ${item.name} to cart`}
            >
              + Add
            </button>
          ) : (
            <div className="qty-controls-inline">
              <button
                type="button"
                onClick={() =>
                  quantity === 1 ? remove(item.id) : setQuantity(item.id, quantity - 1)
                }
                aria-label={`Decrease ${item.name} quantity`}
              >
                −
              </button>
              <span className="qty-value" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(item.id, quantity + 1)}
                aria-label={`Increase ${item.name} quantity`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
