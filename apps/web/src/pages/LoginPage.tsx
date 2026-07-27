import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { ApiError } from '../lib/api-error';

export function LoginPage() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email: email.trim(), password });
      notify(`Welcome back, ${user.name.split(' ')[0]}`);
      void navigate(redirectTo, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not sign you in right now',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page-top fade-in">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to track orders and reorder favourites.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="place-order-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner compact label="Signing in" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <div className="auth-demo">
          <strong>Demo accounts</strong>
          <span>Customer — demo@foodjet.dev / Demo@12345</span>
          <span>Admin — admin@foodjet.dev / Admin@12345</span>
        </div>
      </div>
    </div>
  );
}
