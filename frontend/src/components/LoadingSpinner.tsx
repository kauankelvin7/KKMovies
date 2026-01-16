/**
 * Loading spinner component moderno
 */
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      {/* Spinner principal */}
      <div className="relative">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-500/20"></div>
        
        {/* Animated ring */}
        <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-primary-500 border-r-accent-500 animate-spin"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 blur-xl opacity-30 animate-pulse-slow"></div>
      </div>

      {/* Loading text */}
      <p className="mt-6 text-gray-400 font-medium flex items-center gap-2">
        <span className="animate-pulse">Carregando</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
      </p>
    </div>
  );
};

export default LoadingSpinner;
