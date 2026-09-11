import { useAppStore } from '../store/useAppStore';
import { clearApiCache } from '../services/movieService';
import { GlassModal } from './ui/GlassModal';
import { Trash2 } from 'lucide-react';
import { useTVMode, setTVPreference } from '../hooks/useTVMode';
import { BlockerInstall } from './BlockerInstall';

export function SettingsModal() {
  const { settingsModal, closeSettings, addToast } = useAppStore();
  const { preference, isTV } = useTVMode();
  return <GlassModal isOpen={settingsModal.isOpen} onClose={closeSettings} title="Preferências" ariaLabel="Preferências" size="sm">
    <p className="text-sm text-white/65 mb-5">Atualize as informações salvas do catálogo. Sua lista e seu histórico serão preservados.</p>
    <fieldset className="display-preferences"><legend>Modo de exibição</legend><div>{([{ value: 'auto', label: 'Automático' }, { value: 'tv', label: 'TV' }, { value: 'standard', label: 'Padrão' }] as const).map(option => <button key={option.value} className="glass-button" aria-pressed={preference === option.value} onClick={() => setTVPreference(option.value)}>{option.label}</button>)}</div><p>{isTV ? 'Modo TV ativo. Use as setas e OK. Na busca, OK abre o teclado da TV; cima/baixo sai do campo.' : 'Ative TV para usar o controle remoto. Automático identifica TVs pelo navegador.'}</p></fieldset>
    <BlockerInstall />
    <button className="glass-button" onClick={() => { clearApiCache(); addToast('Cache atualizado. Reabra a página para carregar o catálogo.', 'success'); }}><Trash2 size={16} /> Limpar cache do catálogo</button>
  </GlassModal>;
}
