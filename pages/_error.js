import Link from 'next/link';

function ErrorPage({ statusCode }) {
  return (
    <main className="empty-state">
      <span className="kicker">Erreur {statusCode || 500}</span>
      <h2>{statusCode === 404 ? 'Page introuvable' : 'Une erreur est survenue'}</h2>
      <p><Link href="/">Revenir au paysage applicatif</Link></p>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode || err?.statusCode || 404;
  return { statusCode };
};

export default ErrorPage;
