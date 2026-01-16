import { useEffect, useState } from 'react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
  title: string;
}

const PlayerModal = ({ isOpen, onClose, streamUrl, title }: PlayerModalProps) => {
  const [showPlayer, setShowPlayer] = useState(false);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      // Delay para evitar detecção
      const timer = setTimeout(() => setShowPlayer(true), 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = 'unset';
      };
    }
    setShowPlayer(false);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const openInNewTab = () => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white truncate pr-4">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={openInNewTab}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir em Nova Aba
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-dark-700 hover:bg-red-600 text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Player */}
        <div className="relative bg-black rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
          {showPlayer ? (
            <iframe
              src={streamUrl}
              title={title}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Dica */}
        <div className="mt-4 p-4 bg-dark-800/80 rounded-lg border border-dark-700">
          <p className="text-center text-gray-300 text-sm">
            💡 <strong>Dica:</strong> Se o player não carregar, clique em "Abrir em Nova Aba" para assistir diretamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
