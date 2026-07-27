import type { CartLine } from '../context/cart-context';
import { useCart } from '../context/cart-context';
import { formatPaise } from '../lib/format';

interface CartLineItemProps {
  line: CartLine;
}

export function CartLineItem({ line }: CartLineItemProps) {
  const { setQuantity, remove } = useCart();

  return (
    <div className="cart-item">
      <img src={line.imageUrl} alt="" className="cart-item-image" loading="lazy" />

      <div className="cart-item-details">
        <h4 className="cart-item-name">{line.name}</h4>
        <span className="cart-item-price">
          {formatPaise(line.unitPricePaise * line.quantity)}
        </span>
        <span className="cart-item-unit">{formatPaise(line.unitPricePaise)} each</span>
      </div>

      <div className="cart-item-controls">
        <div className="qty-controls-inline">
          <button
            type="button"
            onClick={() =>
              line.quantity === 1
                ? remove(line.menuItemId)
                : setQuantity(line.menuItemId, line.quantity - 1)
            }
            aria-label={`Decrease ${line.name} quantity`}
          >
            −
          </button>
          <span className="qty-value" aria-live="polite">
            {line.quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(line.menuItemId, line.quantity + 1)}
            aria-label={`Increase ${line.name} quantity`}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="cart-item-remove"
          onClick={() => remove(line.menuItemId)}
          aria-label={`Remove ${line.name} from cart`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
