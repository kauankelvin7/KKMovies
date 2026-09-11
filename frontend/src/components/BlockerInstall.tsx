import { ShieldCheck, ExternalLink } from 'lucide-react';
import { getBlockerInstall } from '../utils/blockerInstall';
import './blocker-install.css';

export function BlockerInstall() {
  const option = getBlockerInstall(navigator.userAgent);
  return <section className="blocker-install" aria-label="Instalar bloqueador de anúncios">
    <h3><ShieldCheck size={22} aria-hidden="true"/>Bloqueador de anúncios</h3>
    <p>{option.description}</p>
    <a href={option.url} target="_blank" rel="noopener noreferrer" className="blocker-install-link">{option.label}<ExternalLink size={18} aria-hidden="true"/><span className="blocker-install-sr"> (abre em nova aba)</span></a>
    <p className="blocker-install-steps">Na loja oficial, confirme a instalação no navegador. Depois, volte ao KKMovies e recarregue o player. Se já instalou, não precisa repetir.</p>
  </section>;
}
