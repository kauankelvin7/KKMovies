import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Search bar component moderno com glassmorphism
 */
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow effect no foco */}
        <div className={`absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-xl transition-opacity duration-300 ${
          isFocused ? 'opacity-30' : 'opacity-0'
        }`}></div>
        
        <div className="relative flex items-center">
          {/* Ícone de busca */}
          <div className="absolute left-6 text-gray-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Buscar filmes, séries e animes..."
            className="w-full pl-16 pr-32 py-5 glass rounded-2xl text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500/50
                       transition-all duration-300 text-lg"
          />

          {/* Botão de busca */}
          <button
            type="submit"
            className="absolute right-2 btn-primary px-8 py-3 flex items-center gap-2"
          >
            <span className="hidden sm:inline font-semibold">Buscar</span>
            <span className="text-xl">🔍</span>
          </button>
        </div>

        {/* Hint text */}
        <p className="text-gray-400 text-sm mt-3 text-center">
          <span className="inline-flex items-center gap-1">
            <span>💡</span>
            Dica: Pressione Enter para buscar rapidamente
          </span>
        </p>
      </form>
    </div>
  );
};

export default SearchBar;
