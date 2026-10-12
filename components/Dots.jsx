import { INTERFACE_COLORS } from '../lib/landscapeView';

// Pastilles des interfaces actives d'une application. Le libellé est porté par title / aria-label.
export default function Dots({ app, interfaces, size }) {
  const active = interfaces.filter(i => app.interfaces[i.key]);
  if (!active.length) return null;
  const label = `Interfaces : ${active.map(i => i.label.toLowerCase()).join(', ')}`;
  return (
    <span className="app-chip-dots" role="img" aria-label={label} title={label}>
      {active.map(i => (
        <span key={i.key} className={`dot${size === 'lg' ? ' dot-lg' : ''}`} style={{ background: INTERFACE_COLORS[i.key] }} />
      ))}
    </span>
  );
}
