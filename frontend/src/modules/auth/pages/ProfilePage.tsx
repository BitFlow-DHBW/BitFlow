import { FormEvent, useState } from 'react';
import { useAuth } from '../AuthContext';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    await updateProfile({ ...user, name });
    setMessage('Profil gespeichert.');
  }

  return (
    <main className="page-shell narrow-page">
      <section className="page-header">
        <p className="eyebrow">Profil</p>
        <h1>Dein BitFlow Konto</h1>
      </section>

      <form className="settings-panel stack-form" onSubmit={handleSubmit}>
        <label>
          Anzeigename
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          E-Mail
          <input value={user?.email ?? ''} disabled />
        </label>
        {message && <p className="form-success">{message}</p>}
        <button className="primary-button" type="submit">
          Profil speichern
        </button>
      </form>
    </main>
  );
}
