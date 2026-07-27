import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { ApiError } from '../lib/api-error';

export function RegisterPage() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });

      notify(`Welcome to FoodJet, ${user.name.split(' ')[0]}`);
      void navigate('/', { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const [path, messages] of Object.entries(caught.fieldErrors)) {
          if (messages[0]) mapped[path] = messages[0];
        }

        setErrors(mapped);
        // Show the banner only when nothing landed on a field, so the message
        // is not repeated twice on screen.
        if (Object.keys(mapped).length === 0) setFormError(caught.message);
      } else {
        setFormError('Could not create your account right now');
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page-top fade-in">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Save your details and keep every order in one place.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="auth-error" role="alert">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              value={form.phone}
              onChange={(event) =>
                update('phone', event.target.value.replace(/\D/g, '').slice(0, 10))
              }
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <div className="form-error">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              className={errors.password ? 'error' : ''}
              aria-describedby="password-hint"
            />
            {errors.password ? (
              <div className="form-error">{errors.password}</div>
            ) : (
              <div className="form-hint" id="password-hint">
                At least 8 characters, with a letter and a number.
              </div>
            )}
          </div>

          <button type="submit" className="place-order-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner compact label="Creating account" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
