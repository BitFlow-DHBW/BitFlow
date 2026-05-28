import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AuthPageShell } from '../components/AuthPageShell';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/projects';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    }
  }

  return (
    <AuthPageShell
      title="Willkommen zurück"
      subtitle="Melde dich an, um deine Schaltungen und Projekte weiterzubauen."
      footer={
        <>
          <Link to="/reset-password">Passwort vergessen?</Link>
          <span>
            Noch kein Konto? <Link to="/register">Registrieren</Link>
          </span>
        </>
      }
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          E-Mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Passwort
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit">
          Anmelden
        </button>
      </form>
    </AuthPageShell>
  );
}
