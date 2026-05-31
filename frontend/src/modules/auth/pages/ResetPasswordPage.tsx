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
      setMessage('Anfrage erfolgreich: Die E-Mail-Adresse wurde geprüft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zurücksetzen fehlgeschlagen.');
    }
  }

  return (
    <AuthPageShell
      title="Passwort zurücksetzen"
      subtitle="Gib deine E-Mail-Adresse ein, um dein Konto zu prüfen."
      footer={<Link to="/login">Zurück zur Anmeldung</Link>}
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          E-Mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <button className="primary-button" type="submit">
          Link zum Zurücksetzen anfordern
        </button>
      </form>
    </AuthPageShell>
  );
}
