import { Link } from 'react-router-dom';
import bitflowLogo from '../../../assets/bitflow.svg';

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthPageShell({ title, subtitle, children, footer }: AuthPageShellProps) {
  return (
    <main className="auth-page">
      <Link className="landing-brand auth-brand" to="/">
        <img className="brand-mark" src={bitflowLogo} alt="" aria-hidden="true" />
        <span>BitFlow</span>
      </Link>
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">BitFlow Zugang</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="auth-card">
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
