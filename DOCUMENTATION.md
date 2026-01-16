# 🎬 KKMovies - Sistema de Streaming de Filmes

## 📋 Visão Geral

KKMovies é um sistema completo de streaming de filmes desenvolvido com as melhores práticas de desenvolvimento web. O projeto possui uma arquitetura separada entre frontend e backend, garantindo escalabilidade e manutenibilidade.

## 🏗️ Arquitetura do Projeto

```
KKMovies/
│
├── frontend/                      # Aplicação React
│   ├── src/
│   │   ├── components/           # Componentes reutilizáveis
│   │   │   ├── Header.tsx       # Cabeçalho com navegação
│   │   │   ├── Footer.tsx       # Rodapé
│   │   │   ├── MovieCard.tsx    # Card de filme individual
│   │   │   ├── MovieGrid.tsx    # Grid de filmes
│   │   │   ├── SearchBar.tsx    # Barra de pesquisa
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   │
│   │   ├── pages/                # Páginas da aplicação
│   │   │   ├── HomePage.tsx     # Página inicial
│   │   │   ├── MovieDetailsPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── CategoryMoviesPage.tsx
│   │   │   ├── TrendingPage.tsx
│   │   │   ├── PopularPage.tsx
│   │   │   └── TopRatedPage.tsx
│   │   │
│   │   ├── services/             # Serviços de API
│   │   │   ├── api.ts           # Cliente Axios configurado
│   │   │   └── movieService.ts  # Serviço de filmes
│   │   │
│   │   ├── hooks/                # Custom React Hooks
│   │   │   └── useMovies.ts     # Hook para gerenciar estado de filmes
│   │   │
│   │   ├── types/                # TypeScript Types
│   │   │   └── movie.ts         # Tipos de filmes
│   │   │
│   │   ├── utils/                # Funções utilitárias
│   │   │   └── helpers.ts       # Helpers gerais
│   │   │
│   │   ├── App.tsx              # Componente principal com rotas
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Estilos globais (Tailwind)
│   │
│   ├── public/                   # Arquivos estáticos
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── backend/                      # API Node.js
    ├── src/
    │   ├── controllers/         # Controladores de rotas
    │   │   └── movie.controller.ts
    │   │
    │   ├── services/            # Lógica de negócio
    │   │   └── tmdb.service.ts # Integração com TMDB API
    │   │
    │   ├── routes/              # Definição de rotas
    │   │   ├── index.ts
    │   │   └── movie.routes.ts
    │   │
    │   ├── middleware/          # Middlewares Express
    │   │   ├── error.middleware.ts
    │   │   └── logger.middleware.ts
    │   │
    │   ├── types/               # TypeScript Types
    │   │   └── movie.types.ts
    │   │
    │   ├── app.ts              # Configuração do Express
    │   └── server.ts           # Entry point
    │
    ├── dist/                    # Build output
    ├── package.json
    ├── tsconfig.json
    └── nodemon.json
```

## ✨ Funcionalidades Implementadas

### Frontend
- ✅ **Interface Responsiva** - Design adaptável para mobile, tablet e desktop
- ✅ **Página Inicial** - Hero section com filmes em destaque
- ✅ **Pesquisa de Filmes** - Busca em tempo real com debounce
- ✅ **Categorias** - Navegação por gêneros de filmes
- ✅ **Filmes em Destaque**:
  - Trending (Em Alta)
  - Popular (Populares)
  - Top Rated (Mais Bem Avaliados)
  - Latest Releases (Lançamentos)
- ✅ **Detalhes do Filme** - Página completa com informações detalhadas
- ✅ **Filmes Similares** - Recomendações baseadas no filme atual
- ✅ **Sistema de Avaliações** - Exibição de ratings do TMDB
- ✅ **Paginação** - Navegação entre páginas de resultados

### Backend
- ✅ **API RESTful** - Endpoints bem estruturados
- ✅ **Integração TMDB** - Dados em tempo real da API do TMDB
- ✅ **Rate Limiting** - Proteção contra abuso (100 req/15min)
- ✅ **CORS Configurado** - Segurança para requisições cross-origin
- ✅ **Error Handling** - Tratamento robusto de erros
- ✅ **Request Logging** - Log de todas as requisições
- ✅ **TypeScript** - Type safety em todo o código

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn
- Chave da API do TMDB ([Obter aqui](https://www.themoviedb.org/settings/api))

### 1. Configurar o Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
copy .env.example .env

# Editar .env e adicionar sua chave da API TMDB
# TMDB_API_KEY=sua_chave_aqui

# Iniciar servidor de desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 2. Configurar o Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Criar arquivo .env (opcional)
copy .env.example .env

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 🔑 Variáveis de Ambiente

### Backend (.env)
```env
PORT=3001
TMDB_API_KEY=sua_chave_tmdb_aqui
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## 📡 Endpoints da API

### Movies
- `GET /api/movies/trending?page=1` - Filmes em alta
- `GET /api/movies/popular?page=1` - Filmes populares
- `GET /api/movies/top-rated?page=1` - Filmes mais bem avaliados
- `GET /api/movies/latest?page=1` - Lançamentos
- `GET /api/movies/genre?genreId=28&page=1` - Filmes por gênero
- `GET /api/movies/search?query=matrix&page=1` - Buscar filmes
- `GET /api/movies/genres` - Listar todos os gêneros
- `GET /api/movies/:id` - Detalhes de um filme
- `GET /api/movies/:id/recommendations?page=1` - Recomendações
- `GET /api/movies/:id/similar?page=1` - Filmes similares

### Outros
- `GET /api/health` - Health check
- `GET /` - Informações da API

## 🎨 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool extremamente rápido
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização utilitária
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Type safety
- **Axios** - Cliente HTTP para TMDB
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Variáveis de ambiente

## 📝 Padrões de Código

### Comentários
- Todos os comentários estão em **inglês**
- Documentação JSDoc nos componentes e funções principais
- Código auto-explicativo com nomes descritivos

### Organização
- **Separação de responsabilidades** clara
- **Components** reutilizáveis e single-purpose
- **Services** para lógica de API
- **Hooks** customizados para lógica compartilhada
- **Types** centralizados para TypeScript

### Performance
- Lazy loading de imagens
- Debounce na busca
- Paginação eficiente
- Cache de requisições HTTP (via Axios)

## 🔄 Fluxo de Dados

```
User Interface (React)
       ↓
  Services Layer (movieService.ts)
       ↓
  API Client (axios)
       ↓
  Backend API (Express)
       ↓
  TMDB Service (tmdb.service.ts)
       ↓
  TMDB API (External)
```

## 🎯 Próximas Melhorias Sugeridas

1. **Autenticação de Usuários**
   - Sistema de login/registro
   - Perfis de usuário

2. **Watchlist**
   - Adicionar filmes à lista de favoritos
   - Histórico de visualização

3. **Player de Vídeo**
   - Integração com fonte de streams
   - Controles personalizados

4. **Avaliações de Usuários**
   - Sistema de reviews
   - Ratings personalizados

5. **Cache e Otimizações**
   - Redis para cache
   - Service Workers (PWA)

6. **Testes**
   - Testes unitários (Jest)
   - Testes E2E (Cypress)

## 📄 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

**Desenvolvido com ❤️ usando React, TypeScript e Node.js**
