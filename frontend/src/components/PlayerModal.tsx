import { useEffect, useState } from 'react';
import { X, ExternalLink, Maximize2, Loader2, Lightbulb } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
  title: string;
}

const PlayerModal = ({ isOpen, onClose, streamUrl, title }: PlayerModalProps) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      // Delay para evitar detecção
      const timer = setTimeout(() => {
        setShowPlayer(true);
        setIsLoading(false);
      }, 300);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = 'unset';
      };
    }
    setShowPlayer(false);
    setIsLoading(true);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const openInNewTab = () => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  const openFullscreen = () => {
    const iframe = document.querySelector('iframe');
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" data-app-modal data-app-element>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/98 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-7xl mx-2 sm:mx-4 z-10 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 px-1 sm:px-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-1 h-6 sm:h-8 bg-primary-500 rounded-full flex-shrink-0" />
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={openFullscreen}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-300 border border-white/10"
              title="Tela cheia"
            >
              <Maximize2 size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={openInNewTab}
              className="p-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-primary-500/20 hover:bg-primary-500 text-primary-400 hover:text-white text-sm font-medium transition-all duration-300 flex items-center gap-2 border border-primary-500/30"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Nova Aba</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-300 border border-white/10"
            >
              <X size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </div>
        
        {/* Player Container */}
        <div className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10" style={{ paddingTop: '56.25%' }}>
          {showPlayer ? (
            <iframe
              src={streamUrl}
              title={title}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoading(false)}
            />
          ) : null}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/90 gap-3 sm:gap-4">
              <Loader2 size={36} className="sm:w-12 sm:h-12 text-primary-500 animate-spin" />
              <p className="text-gray-400 text-xs sm:text-sm">Carregando player...</p>
            </div>
          )}
        </div>
        
        {/* Footer Tips - simpler on mobile */}
        <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-dark-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/5 flex items-center justify-between flex-wrap gap-2 sm:gap-4">
          <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-2">
            <Lightbulb size={16} className="sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
            <span className="hidden xs:inline"><strong className="text-white">Dica:</strong> Se o player não carregar, clique em "Nova Aba".</span>
            <span className="xs:hidden">Não carregou? Use "Nova Aba"</span>
          </p>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span>Pressione <kbd className="px-2 py-1 bg-dark-700 rounded text-gray-300">ESC</kbd> para fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
