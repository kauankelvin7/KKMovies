# KKMovies

Catálogo de filmes e séries em React + Vite, com API Express local e adaptadores Vercel. TMDB fornece apenas metadados e imagens. WarezCDN é o único provedor de reprodução e sua lista de IDs filtra os resultados exibidos. Não há canais ou eventos na navegação nem na API de catálogo.

## Executar

```sh
npm run install:all
npm run dev
```

Frontend: http://localhost:3000. API: http://localhost:3001. A porta do frontend é fixa para não ocupar acidentalmente a porta da API; se estiver em uso, encerre sua outra instância ou execute `npm run dev --prefix frontend -- --port 3002`.

Configure `TMDB_API_KEY` no ambiente do servidor (ou em `.env.local` na raiz para desenvolvimento). O fallback legado `freekeys` permanece exclusivamente no servidor para compatibilidade, com prazo de espera limitado. Uma chave própria elimina a dependência desse serviço externo. Nunca exponha a chave usando prefixo `VITE_`.

Variáveis opcionais:

- `WAREZCDN_BASE_URL` (ou `STREAMING_BASE_URL`): domínio do provedor no backend; padrão `https://warezcdn.sbs`.
- `VITE_WAREZCDN_BASE_URL`: mesmo domínio para o iframe no frontend. Se alterar o domínio, configure ambos.
- `VITE_API_URL`: use somente para backend separado. Sem ela, o frontend usa a mesma origem, com proxy Vite no desenvolvimento.
- `PORT`: porta do backend; ao alterá-la, ajuste também o destino do proxy no Vite.

## Verificar

```sh
npm run check
npm run build
```

Os testes não acessam serviços reais: exercitam a lista de disponibilidade, respostas concorrentes, exclusão de pessoas na busca, temporadas especiais, URLs, erros e paginação. As consultas reais de integração dependem da disponibilidade dos serviços externos.

## Estrutura e rotas

- `backend/src/services/catalog.service.ts`: contrato único de catálogo e reprodução, compartilhado por Express e Vercel.
- `backend/src/routes/catalog.routes.ts`: adaptador Express.
- `api/lib/catalog-handler.ts`: adaptador Vercel; suporta GET e OPTIONS e responde 405 para outros métodos.
- `frontend/src/design-system.css`: tokens, superfícies, controles glass, proporções das capas, responsividade e movimento reduzido.
- Páginas: `/`, `/filmes`, `/series`, `/series/:id`, `/serie/:id`, `/filme/:id`, `/buscar`, `/explorar`, `/minha-lista`, `/top10`. Endereços desconhecidos mostram 404.

Catálogo: `/api/movies` e `/api/series`, com `popular`, `trending`, `top-rated`, `genres`, `discover`, `search`, detalhes, `credits`, `videos`, `similar`, `recommendations` e temporadas para séries. Busca unificada: `/api/movies/search-multi?query=...`.

Reprodução: `/api/streaming/movie/:id`, `/api/streaming/series/:id[/temporada[/episodio]]`. Listas aceitam apenas filmes e séries. O iframe abre diretamente o domínio documentado, sem proxies de HTML, sondagens de CAPTCHA ou troca automática de servidor.

## Limitações verificadas e decisões

- `/lista?category=filme&type=tmdb&format=json` entrega IDs, sem títulos ou capas. Na consulta realizada, a pesquisa pública retornou somente grupos de canais e eventos. Por isso o uso de TMDB apenas para metadados foi autorizado.
- Disponibilidade na lista não garante reprodução de cada episódio. O provedor pode solicitar verificação no iframe; ela deve ser concluída pelo visitante. `onLoad` do iframe não prova que o vídeo iniciou.
- Paginação usa as páginas do TMDB, limitadas a 500, filtradas pela disponibilidade. Uma página pode ter menos de 20 títulos ou ficar vazia; os controles permitem seguir para a próxima. Totais são os do metadado, não uma contagem exata do acervo filtrado.
- Até três consultas externas simultâneas por processo, cache limitado a 250 entradas, reutilização de chamadas idênticas, timeout e duas novas tentativas para 429. Não substitui um limite distribuído entre instâncias.
- Erros não entram no cache do servidor; respostas de erro usam `no-store`. Sem uma lista válida do provedor, o catálogo falha explicitamente, em vez de oferecer títulos sem disponibilidade confirmada.
- Histórico registra acesso ao player. Não são inventados minutos assistidos ou porcentagens: o iframe não documenta um protocolo de progresso para a aplicação.
- Favoritos usam o mesmo armazenamento e distinguem filme e série com IDs iguais. A lista legada é migrada quando não existe a lista atual; entradas antigas sem tipo são tratadas como filmes.
- Este projeto é Vite/React, não Next.js. Não existe `generateStaticParams`; o risco de pré-gerar todo o catálogo não se aplica. As antigas implementações duplicadas foram substituídas pelo contrato compartilhado.

## Publicação

Na Vercel, configure `TMDB_API_KEY` para os ambientes Production, Preview e Development e faça um novo deploy. `WAREZCDN_BASE_URL`/`STREAMING_BASE_URL` é opcional se o domínio padrão for o correto. As funções em `api/` têm limite de 30 segundos, mas a consulta opcional da lista do provedor falha em 4 segundos para não segurar a resposta. Caso o provedor bloqueie a Vercel, o catálogo continuará a responder com resultados do TMDB sem o filtro de disponibilidade (`availability_filtered: false`), em vez de falhar com 502; a reprodução continua dependendo de o iframe do provedor estar acessível no navegador.
