import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Loader2 } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
  title: string;
}

const PlayerModal = ({ isOpen, onClose, streamUrl, title }: PlayerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen || !mounted) return null;

  // Portal renderizado diretamente no body
  // Estrutura atualizada para garantir scroll correto e evitar cortes (clipping) em telas pequenas
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* Overlay click to close */}
        <div 
          className="fixed inset-0 transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Modal Container - Responsive Card - Glassmorphism Updated */}
        <div 
          ref={modalRef}
          className="relative w-[90vw] sm:w-[85vw] max-w-sm md:max-w-xl lg:max-w-2xl flex flex-col bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 z-10 ring-1 ring-white/10 my-auto"
          style={{ WebkitBackdropFilter: 'blur(24px)' }}
        >
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 backdrop-blur-md shrink-0 rounded-t-2xl">
           <h2 className="text-sm md:text-base font-medium text-white/90 truncate flex-1 mr-4 drop-shadow-sm">
             {title}
           </h2>
           <button 
             onClick={onClose} 
             className="p-1.5 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50" 
             title="Fechar"
           >
             <X size={18} />
           </button>
        </div>

        {/* Player Wrapper - Aspect Ratio (Mobile Portrait / Desktop Landscape) */}
        <div className="relative w-full aspect-[9/16] sm:aspect-video bg-black/50 group shrink-0 overflow-hidden">
          {isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 backdrop-blur-md">
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary-500 animate-spin mb-2" />
                <p className="text-xs text-zinc-400">Carregando...</p>
             </div>
          )}
          <iframe 
            src={streamUrl} 
            title={title}
            className="w-full h-full border-0 absolute inset-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => setIsLoading(false)}
          />
        </div>
        
        {/* Footer / Controls */}
        <div className="bg-white/5 backdrop-blur-md px-4 py-3 border-t border-white/5 flex items-center justify-between gap-4 shrink-0">
           <button 
             onClick={() => window.open(streamUrl, '_blank')} 
             className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors shadow-sm whitespace-nowrap" 
             title="Caso não carregue, clique aqui"
           >
             <ExternalLink size={14} />
             <span>Assistir em Nova Aba</span>
           </button>

           <div className="hidden sm:block text-[10px] text-zinc-600">
             Pressione ESC para fechar
           </div>
        </div>
      </div>
    </div>
    </div>,
    document.body
  );
};

export default PlayerModal;
