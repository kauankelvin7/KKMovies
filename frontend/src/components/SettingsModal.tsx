import { useAppStore } from '../store/useAppStore';
import { clearApiCache } from '../services/movieService';
import { GlassModal } from './ui/GlassModal';
import { Trash2 } from 'lucide-react';

export function SettingsModal() {
  const { settingsModal, closeSettings, addToast } = useAppStore();
  return <GlassModal isOpen={settingsModal.isOpen} onClose={closeSettings} title="Preferências" ariaLabel="Preferências" size="sm">
    <p className="text-sm text-white/65 mb-5">Atualize as informações salvas do catálogo. Sua lista e seu histórico serão preservados.</p>
    <button className="glass-button" onClick={() => { clearApiCache(); addToast('Cache atualizado. Reabra a página para carregar o catálogo.', 'success'); }}><Trash2 size={16} /> Limpar cache do catálogo</button>
  </GlassModal>;
}
