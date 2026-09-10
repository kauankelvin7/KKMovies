<div align="center">

# 🎬 KKMovies

**Catálogo de filmes e séries com metadados do TMDB e reprodução via WarezCDN.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#-licença)
[![Node](https://img.shields.io/badge/node-24.x-339933?logo=node.js&logoColor=white)](#-pré-requisitos)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#-stack)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#-stack)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](#-stack)

</div>

---

## 📖 Sobre o projeto

O **KKMovies** é um catálogo de filmes e séries construído em **React + Vite**, com uma **API Express** própria e adaptadores para a **Vercel**. O **TMDB** é usado exclusivamente como fonte de metadados e imagens; a reprodução é feita por um único provedor, o **WarezCDN**, cuja lista de IDs disponíveis filtra o que é exibido no catálogo. Não existem canais ao vivo ou eventos, nem na navegação nem na API.

## 📑 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Stack](#-stack)
- [Pré-requisitos](#-pré-requisitos)
- [Como executar](#-como-executar)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Verificação e build](#-verificação-e-build)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Rotas](#-rotas)
- [Limitações verificadas e decisões de design](#-limitações-verificadas-e-decisões-de-design)
- [Publicação (deploy)](#-publicação-deploy)
- [Como contribuir](#-como-contribuir)
- [Licença](#-licença)

## 🧱 Stack

| Camada | Tecnologias |
| --- | --- |
| **Frontend** | React 18, TypeScript, Vite, React Router, Zustand, Tailwind CSS, PWA (`vite-plugin-pwa`), `hls.js` |
| **Backend** | Node.js, Express, TypeScript |
| **Serverless** | Adaptadores para Vercel Functions (`api/`) |
| **Dados** | TMDB (metadados/imagens) · WarezCDN (reprodução) |
| **Deploy** | Vercel, Render (configurações já incluídas) |

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org/) `24.x`
- npm
- Uma [chave de API do TMDB](https://www.themoviedb.org/settings/api)

## 🚀 Como executar

```sh
# 1. Clone o repositório
git clone https://github.com/kauankelvin7/KKMovies.git
cd KKMovies

# 2. Instale as dependências (raiz, backend e frontend)
npm run install:all

# 3. Suba backend e frontend juntos
npm run dev
```

Depois de iniciar:

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001

> A porta do frontend é fixa para não colidir acidentalmente com a porta da API. Se `3000` já estiver em uso, encerre a outra instância ou rode `npm run dev --prefix frontend -- --port 3002`.

## 🔑 Variáveis de ambiente

Configure `TMDB_API_KEY` no ambiente do servidor (ou em um arquivo `.env.local` na raiz, para desenvolvimento). **Nunca** exponha essa chave com o prefixo `VITE_`.

> O fallback legado `freekeys` continua disponível apenas no servidor, para compatibilidade, com um tempo de espera limitado. Ter sua própria chave elimina a dependência desse serviço externo.

| Variável | Obrigatória | Descrição |
| --- | :---: | --- |
| `TMDB_API_KEY` | ✅ | Chave de API do TMDB, usada pelo backend. |
| `WAREZCDN_BASE_URL` / `STREAMING_BASE_URL` | – | Domínio do provedor de streaming no backend. Padrão: `https://warezcdn.sbs`. |
| `VITE_WAREZCDN_BASE_URL` | – | Mesmo domínio, usado pelo iframe no frontend. Ao trocar o domínio, atualize **as duas** variáveis. |
| `VITE_API_URL` | – | Use apenas se o backend estiver em um domínio separado. Sem ela, o frontend usa a mesma origem, com proxy do Vite em desenvolvimento. |
| `PORT` | – | Porta do backend. Se alterada, ajuste também o destino do proxy no Vite. |

## 🧪 Verificação e build

```sh
npm run check   # tipagem (backend, api, frontend) + testes de backend
npm run build   # build de produção do frontend
```

Os testes não acessam serviços reais: cobrem a lista de disponibilidade, respostas concorrentes, exclusão de pessoas na busca, temporadas especiais, geração de URLs, tratamento de erros e paginação. Consultas reais de integração dependem da disponibilidade dos serviços externos (TMDB e WarezCDN).

## 🗂️ Estrutura do projeto

```
KKMovies/
├── api/                # Adaptadores serverless para a Vercel
│   ├── lib/
│   ├── movies/
│   ├── series/
│   └── streaming/
├── backend/            # API Express (TypeScript)
│   ├── src/
│   └── tests/
├── frontend/           # Aplicação React + Vite
│   ├── public/
│   └── src/
├── docs/               # Documentação técnica complementar
└── scripts/            # Scripts auxiliares de build/verificação
```

Pontos-chave da arquitetura:

- **`backend/src/services/catalog.service.ts`** — contrato único de catálogo e reprodução, compartilhado entre Express e Vercel.
- **`backend/src/routes/catalog.routes.ts`** — adaptador Express.
- **`api/lib/catalog-handler.ts`** — adaptador Vercel; suporta `GET`/`OPTIONS` e responde `405` para os demais métodos.
- **`frontend/src/design-system.css`** — tokens visuais, superfícies, controles em glassmorphism, proporções de capas, responsividade e suporte a movimento reduzido.

## 🧭 Rotas

**Páginas (frontend):** `/`, `/filmes`, `/series`, `/series/:id`, `/serie/:id`, `/filme/:id`, `/buscar`, `/explorar`, `/minha-lista`, `/top10`. Caminhos desconhecidos exibem 404.

**Catálogo (API):** `/api/movies` e `/api/series`, com suporte a `popular`, `trending`, `top-rated`, `genres`, `discover`, `search`, detalhes, `credits`, `videos`, `similar`, `recommendations` e temporadas de séries. Busca unificada em `/api/movies/search-multi?query=...`.

**Reprodução (API):** `/api/streaming/movie/:id` e `/api/streaming/series/:id[/temporada[/episodio]]`. As listas aceitam apenas filmes e séries. O player abre diretamente o domínio documentado do provedor — sem proxy de HTML, sondagem de CAPTCHA ou troca automática de servidor.

## ⚠️ Limitações verificadas e decisões de design

- O endpoint público de listagem do provedor entrega apenas IDs (sem títulos ou capas) e, na consulta realizada, retornou somente grupos de canais e eventos — por isso o uso do TMDB para metadados foi mantido.
- Estar na lista de disponibilidade não garante a reprodução de todo episódio; o provedor pode exigir verificação no iframe, que deve ser concluída pelo visitante.
- A paginação segue as páginas do TMDB (limite de 500), filtradas pela disponibilidade — uma página pode retornar menos de 20 títulos ou ficar vazia, e os totais refletem o metadado, não uma contagem exata do acervo filtrado.
- Há um limite de até três consultas externas simultâneas por processo, cache de até 250 entradas, deduplicação de chamadas idênticas, timeout e duas novas tentativas para respostas `429` — isso não substitui um limite distribuído entre múltiplas instâncias.
- Respostas de erro não são cacheadas (`no-store`); sem uma lista válida do provedor, o catálogo falha explicitamente em vez de exibir títulos sem disponibilidade confirmada.
- O histórico registra apenas o acesso ao player — minutos assistidos ou porcentagem de progresso não são inferidos, pois o iframe não expõe esse protocolo.
- Favoritos usam o mesmo armazenamento local, distinguindo filme e série mesmo com IDs iguais; listas legadas sem tipo são tratadas como filmes na migração.
- O projeto é Vite/React (não Next.js) — não há `generateStaticParams` nem risco de pré-geração de todo o catálogo.

Documentação adicional disponível em [`docs/`](./docs): [atualizações automáticas](./docs/automatic-updates.md), [diagnóstico de embed](./docs/embed-diagnosis.md), [isolamento do player](./docs/player-isolation.md) e [auditoria de UX](./docs/ux-audit.md).

## ☁️ Publicação (deploy)

O repositório já inclui configuração para múltiplas plataformas:

- **Vercel** (`vercel.json`) — configure `TMDB_API_KEY` para os ambientes *Production*, *Preview* e *Development* e faça um novo deploy. `WAREZCDN_BASE_URL`/`STREAMING_BASE_URL` só é necessária se o domínio padrão do provedor mudar. As funções em `api/` têm limite de 30s, mas a consulta opcional da lista do provedor expira em 4s para não travar a resposta; se o provedor bloquear a Vercel, o catálogo continua respondendo com dados do TMDB (`availability_filtered: false`) em vez de falhar com `502`.
- **Render** (`backend/render.yaml`) — deploy do backend como serviço Node.
- **Netlify** (`frontend/netlify.toml`) — deploy do frontend com proxy de `/api/*` para a API publicada.

## 🤝 Como contribuir

Contribuições são bem-vindas! Um fluxo básico:

1. Faça um **fork** deste repositório.
2. Crie uma branch para sua alteração: `git checkout -b minha-melhoria`.
3. Faça commits claros e objetivos.
4. Rode `npm run check` e `npm run build` antes de abrir o PR.
5. Abra um **Pull Request** descrevendo o que foi alterado e por quê.

## 📄 Licença

Distribuído sob a licença **MIT**.