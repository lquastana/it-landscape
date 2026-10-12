import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import { LOGO_URL, ORG_NAME, APP_TITLE } from '../lib/branding';

function normalizeRedirect(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'string') return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  if (raw.startsWith('/login')) return '/';
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAzureProvider, setHasAzureProvider] = useState(false);
  const redirectTo = normalizeRedirect(router.query.redirectedFrom);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let cancelled = false;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (!cancelled && data?.user?.isLoggedIn) router.replace(redirectTo); })
      .catch(() => {});
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(providers => { if (!cancelled) setHasAzureProvider(Boolean(providers?.['azure-ad'])); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [router, redirectTo]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = event.currentTarget;
    const result = await signIn('credentials', {
      username: form.username.value,
      password: form.password.value,
      redirect: false,
      callbackUrl: redirectTo,
    });
    if (result?.ok) {
      router.replace(redirectTo);
    } else {
      setError('Identifiant ou mot de passe incorrect.');
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`Connexion — ${APP_TITLE}`}</title>
      </Head>
      <main className="login-page">
        <div className="login-card">
          <div className="brand">
            {/* Logo configurable, éventuellement hors domaine : <img> volontaire */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {LOGO_URL && <img src={LOGO_URL} alt="" />}
            <div className="brand-text">
              {ORG_NAME && <span className="brand-org">{ORG_NAME}</span>}
              <span className="brand-title">{APP_TITLE}</span>
            </div>
          </div>
          <span className="kicker">Accès réservé</span>
          <h1>Se connecter</h1>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="username">Identifiant</label>
              <input id="username" name="username" type="text" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {hasAzureProvider && (
            <>
              <div className="divider">ou</div>
              <button type="button" className="btn" onClick={() => signIn('azure-ad', { callbackUrl: redirectTo })}>
                Se connecter avec Entra ID
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
