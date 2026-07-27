import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PriceSummary } from '../components/PriceSummary';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/auth-context';
import { useCart } from '../context/cart-context';
import { useToast } from '../context/toast-context';
import { api } from '../lib/api-client';
import { ApiError } from '../lib/api-error';
import { formatPaise } from '../lib/format';

export interface DeliveryDetails {
  customerName: string;
  phone: string;
  addressLine: string;
  deliveryNotes: string;
}

export function CheckoutPage() {
  const { lines, totalItems, pricing, clear } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const placeOrder = async (details: DeliveryDetails) => {
    setIsSubmitting(true);
    setServerErrors({});

    try {
      const order = await api.createOrder({
        customerName: details.customerName.trim(),
        phone: details.phone.trim(),
        addressLine: details.addressLine.trim(),
        ...(details.deliveryNotes.trim()
          ? { deliveryNotes: details.deliveryNotes.trim() }
          : {}),
        // Ids and quantities only. The server prices the order from its own menu.
        items: lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
      });

      clear();
      notify('Order placed — tracking it now');
      void navigate(`/track/${order.id}`, { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        // Map the API's field paths onto the form so errors land on the input
        // that caused them rather than in a generic banner.
        const mapped: Record<string, string> = {};
        for (const [path, messages] of Object.entries(caught.fieldErrors)) {
          const field = path.split('.')[0];
          if (field && messages[0]) mapped[field] = messages[0];
        }

        setServerErrors(mapped);
        notify(caught.message, 'error');
      } else {
        notify('Could not place your order. Please try again.', 'error');
      }

      setIsSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="page page-top">
        <div className="empty-state fade-in">
          <div className="empty-icon">🛒</div>
          <h3>Nothing to check out</h3>
          <p>Add a dish or two first.</p>
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
        <h1 className="page-title">📦 Checkout</h1>
        <p className="page-subtitle">Almost there — where are we delivering?</p>
      </div>

      {!user && (
        <p className="checkout-guest-note">
          Ordering as a guest. <Link to="/login">Sign in</Link> to keep this order in your
          history.
        </p>
      )}

      <div className="checkout-layout">
        {/*
          Keyed on the account so that signing in mid-checkout remounts the form
          with the profile prefilled. Resetting state with a key beats syncing it
          from an effect, which would fight anything already typed.
        */}
        <DeliveryDetailsForm
          key={user?.id ?? 'guest'}
          initialName={user?.name ?? ''}
          initialPhone={user?.phone ?? ''}
          serverErrors={serverErrors}
          isSubmitting={isSubmitting}
          totalPaise={pricing.totalPaise}
          onSubmit={placeOrder}
        />

        <aside className="order-summary">
          <h2 className="order-summary-title">
            Your order ({totalItems} item{totalItems === 1 ? '' : 's'})
          </h2>

          {lines.map((line) => (
            <div key={line.menuItemId} className="order-summary-item">
              <div>
                <span className="item-name">{line.name}</span>
                <span className="item-qty"> × {line.quantity}</span>
              </div>
              <span>{formatPaise(line.unitPricePaise * line.quantity)}</span>
            </div>
          ))}

          <div className="order-summary-totals">
            <PriceSummary pricing={pricing} itemCount={totalItems} />
          </div>
        </aside>
      </div>
    </div>
  );
}

interface DeliveryDetailsFormProps {
  initialName: string;
  initialPhone: string;
  serverErrors: Record<string, string>;
  isSubmitting: boolean;
  totalPaise: number;
  onSubmit: (details: DeliveryDetails) => void | Promise<void>;
}

function DeliveryDetailsForm({
  initialName,
  initialPhone,
  serverErrors,
  isSubmitting,
  totalPaise,
  onSubmit,
}: DeliveryDetailsFormProps) {
  const [form, setForm] = useState<DeliveryDetails>({
    customerName: initialName,
    phone: initialPhone,
    addressLine: '',
    deliveryNotes: '',
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // A field the customer has since corrected should not keep showing the error
  // the server sent for the previous attempt.
  const errors = { ...serverErrors, ...clientErrors };

  const update = (field: keyof DeliveryDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setClientErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /**
   * Mirrors the API's rules so the common mistakes are caught without a round
   * trip. The server validates independently — this is convenience, not trust.
   */
  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};

    if (form.customerName.trim().length < 2) found.customerName = 'Enter your full name';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      found.phone = 'Enter a valid 10-digit mobile number';
    }
    if (form.addressLine.trim().length < 10) {
      found.addressLine = 'Enter a complete delivery address';
    }

    return found;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validate();
    setClientErrors(found);
    if (Object.keys(found).length > 0) return;

    void onSubmit(form);
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">📍 Delivery details</h2>

      <div className="form-group">
        <label htmlFor="customerName">Full name</label>
        <input
          id="customerName"
          type="text"
          autoComplete="name"
          placeholder="e.g. Rahul Sharma"
          value={form.customerName}
          onChange={(event) => update('customerName', event.target.value)}
          className={errors.customerName ? 'error' : ''}
          aria-invalid={Boolean(errors.customerName)}
          aria-describedby={errors.customerName ? 'customerName-error' : undefined}
        />
        {errors.customerName && (
          <div className="form-error" id="customerName-error">
            {errors.customerName}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={form.phone}
          onChange={(event) =>
            update('phone', event.target.value.replace(/\D/g, '').slice(0, 10))
          }
          className={errors.phone ? 'error' : ''}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <div className="form-error" id="phone-error">
            {errors.phone}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="addressLine">Delivery address</label>
        <textarea
          id="addressLine"
          autoComplete="street-address"
          placeholder="e.g. 42, MG Road, Koramangala, Bangalore 560034"
          value={form.addressLine}
          onChange={(event) => update('addressLine', event.target.value)}
          className={errors.addressLine ? 'error' : ''}
          aria-invalid={Boolean(errors.addressLine)}
          aria-describedby={errors.addressLine ? 'addressLine-error' : undefined}
        />
        {errors.addressLine && (
          <div className="form-error" id="addressLine-error">
            {errors.addressLine}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="deliveryNotes">Delivery notes (optional)</label>
        <input
          id="deliveryNotes"
          type="text"
          placeholder="e.g. Ring the bell twice, gate code 4821"
          value={form.deliveryNotes}
          onChange={(event) => update('deliveryNotes', event.target.value)}
        />
      </div>

      <button type="submit" className="place-order-btn" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner compact label="Placing order" />
            Placing order...
          </>
        ) : (
          <>🚀 Place order — {formatPaise(totalPaise)}</>
        )}
      </button>

      <p className="checkout-disclaimer">
        Prices are confirmed by our kitchen when the order is placed.
      </p>
    </form>
  );
}
