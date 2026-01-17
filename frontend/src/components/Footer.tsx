import { Link } from 'react-router-dom';
import { Github, Twitter, MessageCircle, Navigation, Heart } from 'lucide-react';
import { useTheme } from '@/App';

/**
 * Footer component moderno com glassmorphism e gradientes
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isDarkMode } = useTheme();

  const footerLinks = {
    navegacao: [
      { label: 'Início', path: '/' },
      { label: 'Filmes', path: '/filmes' },
      { label: 'Séries', path: '/series' },
      { label: 'Buscar', path: '/search' },
    ],
    social: [
      { label: 'GitHub', icon: Github, url: '#' },
      { label: 'Twitter', icon: Twitter, url: '#' },
      { label: 'Discord', icon: MessageCircle, url: '#' },
    ],
  };

  return (
    <footer className={`relative mt-20 border-t transition-colors duration-300 ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
      {/* Gradiente de fundo */}
      <div className={`absolute inset-0 -z-10 ${isDarkMode ? 'bg-gradient-to-b from-transparent via-dark-900/50 to-dark-950' : 'bg-gradient-to-b from-transparent via-gray-100/50 to-gray-200'}`}></div>
      
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo e Descrição */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#fb923c'}} />
                      <stop offset="100%" style={{stopColor: '#ea580c'}} />
                    </linearGradient>
                  </defs>
                  <circle cx="20" cy="20" r="18" fill={isDarkMode ? "#1a1a1a" : "#ffffff"} stroke="url(#footerLogoGradient)" strokeWidth="2"/>
                  <path d="M12 8 L12 32 L16 32 L16 22 L16 8 Z" fill="url(#footerLogoGradient)"/>
                  <path d="M16 18 L22 8 L27 8 L19 20 Z" fill="url(#footerLogoGradient)"/>
                  <path d="M16 22 L16 32 L30 27 Z" fill="#f97316"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 text-transparent bg-clip-text">KKMovies</span>
                <span className={`text-xs -mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filmes & Séries</span>
              </div>
            </div>
            <p className={`max-w-md mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Seu destino definitivo para assistir aos filmes e séries mais recentes online. 
              Descubra conteúdos em alta, explore categorias e aproveite streaming sem interrupções.
            </p>
            <div className="flex gap-3">
              {footerLinks.social.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    className={`glass p-3 rounded-xl transition-all hover:scale-110 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                    aria-label={social.label}
                  >
                    <IconComponent size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Navigation size={18} className="text-primary-400" /> Navegação
            </h3>
            <ul className="space-y-2">
              {footerLinks.navegacao.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`hover:text-primary-400 transition-colors inline-flex items-center gap-2 group ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 transition-all duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informações */}
          <div>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Heart size={18} className="text-red-400" /> Informações
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Este produto usa a API do TMDb mas não é endossado ou certificado pelo TMDb.
            </p>
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB Logo"
                className="h-6"
              />
            </a>
          </div>
        </div>

        {/* Linha divisória com gradiente */}
        <div className={`h-px bg-gradient-to-r from-transparent to-transparent mb-8 ${isDarkMode ? 'via-white/10' : 'via-black/10'}`}></div>

        {/* Copyright */}
        <div className="text-center">
          <p className={`text-sm flex items-center justify-center gap-2 flex-wrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>© {currentYear} KauanKelvinDev.</span>
            <span className="hidden sm:inline">•</span>
            <span>Todos os direitos reservados.</span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1">
              Feito com <Heart size={14} className="text-orange-500 animate-pulse" /> inteligência!
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
