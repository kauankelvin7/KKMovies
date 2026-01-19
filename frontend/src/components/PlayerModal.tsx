import { useEffect, useState, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from '@/App';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
  title: string;
}

const PlayerModal = memo(({ isOpen, onClose, streamUrl, title }: PlayerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isDarkMode } = useTheme();

  // Cleanup on unmount
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      setIsLoading(true);
      setHasError(false);
    };
  }, []);
  
  // Reset loading state when stream URL changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [streamUrl, isOpen]);

  // Handle ESC key with useCallback for performance
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, handleEsc]);

  // Auto-scroll to player when opened (UX improvement)
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Small delay to ensure render layout is complete
      const timer = setTimeout(() => {
        modalRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);
  
  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.error('[PlayerModal] Erro ao carregar stream');
  }, []);
  
  // Handle overlay click
  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Handle open in new tab
  const handleOpenNewTab = useCallback(() => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  }, [streamUrl]);

  if (!isOpen || !mounted) return null;

  // Portal renderizado diretamente no body - OTIMIZADO sem blur pesado
  return createPortal(
    <div className={`fixed inset-0 z-[9999] overflow-y-auto animate-in fade-in duration-150 ${
      isDarkMode ? 'bg-black/90' : 'bg-black/70'
    }`}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* Overlay click to close */}
        <div 
          className="fixed inset-0 transition-opacity" 
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
        
        {/* Modal Container - OTIMIZADO: removido backdrop-blur para performance */}
        <div 
          ref={modalRef}
          className={`relative w-[90vw] sm:w-[85vw] max-w-sm md:max-w-xl lg:max-w-2xl flex flex-col border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 z-10 my-auto ${
            isDarkMode 
              ? 'bg-zinc-900/95 border-zinc-800' 
              : 'bg-white/95 border-gray-200'
          }`}
        >
        
        {/* Header - OTIMIZADO */}
        <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 rounded-t-2xl ${
          isDarkMode 
            ? 'bg-zinc-800/80 border-zinc-700' 
            : 'bg-gray-100/80 border-gray-200'
        }`}>
           <h2 className={`text-sm md:text-base font-medium truncate flex-1 mr-4 ${
             isDarkMode ? 'text-white' : 'text-gray-900'
           }`}>
             {title}
           </h2>
           <button 
             onClick={onClose} 
             className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
               isDarkMode
                 ? 'text-zinc-300 hover:text-white bg-zinc-700/50 hover:bg-zinc-600'
                 : 'text-gray-600 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-300'
             }`}
             title="Fechar"
           >
             <X size={18} />
           </button>
        </div>

        {/* Player Wrapper - OTIMIZADO: aspect ratio fixo sem transições pesadas */}
        <div className={`relative w-full aspect-[9/16] sm:aspect-video shrink-0 overflow-hidden ${
          isDarkMode ? 'bg-black' : 'bg-gray-900'
        }`}>
          {isLoading && !hasError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary-500 animate-spin mb-2" />
                <p className="text-xs text-zinc-400">Carregando player...</p>
             </div>
          )}
          {hasError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
                <X className="w-8 h-8 md:w-10 md:h-10 text-red-500 mb-2" />
                <p className="text-xs text-zinc-400">Erro ao carregar. Tente abrir em nova aba.</p>
             </div>
          )}
          <iframe 
            ref={iframeRef}
            src={streamUrl} 
            title={title}
            className="w-full h-full border-0 absolute inset-0"
            allowFullScreen
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
        
        {/* Footer / Controls - OTIMIZADO */}
        <div className={`px-4 py-3 border-t flex items-center justify-between gap-4 shrink-0 ${
          isDarkMode 
            ? 'bg-zinc-800/80 border-zinc-700' 
            : 'bg-gray-100/80 border-gray-200'
        }`}>
           <button 
             onClick={handleOpenNewTab} 
             className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors shadow-sm whitespace-nowrap ${
               isDarkMode
                 ? 'text-zinc-300 bg-zinc-700/50 hover:bg-zinc-600 border-zinc-600'
                 : 'text-gray-700 bg-gray-200/50 hover:bg-gray-300 border-gray-300'
             }`}
             title="Caso não carregue, clique aqui"
           >
             <ExternalLink size={14} />
             <span>Assistir em Nova Aba</span>
           </button>

           <div className="hidden sm:block text-[10px] text-zinc-500">
             Pressione ESC para fechar
           </div>
        </div>
      </div>
    </div>
    </div>,
    document.body
  );
});

PlayerModal.displayName = 'PlayerModal';

export default PlayerModal;
