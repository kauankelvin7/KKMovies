interface ErrorMessageProps {
  message: string;
}

/**
 * Componente de mensagem de erro moderno
 */
const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className="my-8 animate-slide-down">
      <div className="relative overflow-hidden rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 blur-xl"></div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-300 mb-1">Ops! Algo deu errado</h3>
              <p className="text-red-200/90">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
