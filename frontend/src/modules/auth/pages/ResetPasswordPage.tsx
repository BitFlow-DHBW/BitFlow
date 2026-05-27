import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AuthPageShell } from '../components/AuthPageShell';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await resetPassword(email);
      setMessage('Anfrage erfolgreich: Das Backend hat die E-Mail-Adresse geprueft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset fehlgeschlagen.');
    }
  }

  return (
    <AuthPageShell
      title="Passwort zurücksetzen"
      subtitle="Der Workflow ist vorbereitet und kann später an einen echten Mail-Service angeschlossen werden."
      footer={<Link to="/login">Zurück zum Login</Link>}
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          E-Mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <button className="primary-button" type="submit">
          Reset-Link anfordern
        </button>
      </form>
    </AuthPageShell>
  );
}
