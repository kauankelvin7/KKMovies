# Reprodução isolada, UI e PWA

## Decisão implementada

O projeto usa React, React Router e Vite, com backend Express e adaptadores de API para Vercel. A reprodução tem uma segunda entrada Vite (`watch.html`). O botão **Abrir player** realiza uma navegação completa para `/watch/:id?type=movie` ou `/watch/:id?type=tv&season=2&episode=4`.

Essa navegação substitui o documento ativo do aplicativo principal. A entrada de reprodução não importa App, Zustand, atalhos globais, modais, catálogo ou código de registro/atualização do service worker. Só recebe um título opcional e descartável via sessionStorage; nenhum endereço de iframe é recebido pela URL ou pelo armazenamento. O navegador pode preservar o documento anterior, suspenso, no cache de voltar/avançar (BFCache); isso não transforma a rota em uma garantia de liberação de memória.

O modal local continua como ponto de entrada. Na versão encontrada do projeto, os seletores de idioma e servidor pertencem ao embed do provedor, não ao código React. A seleção continua no embed; não foram inventados parâmetros para controlar funções que a API não documenta. As páginas de detalhes e os painéis de episódios permanecem disponíveis.

| Camada | Responsabilidade e limite |
| --- | --- |
| `src/player/policy.ts` | Valida IDs e combinações de temporada/episódio. Rejeita parâmetros desconhecidos, duplicados, `src` e redirecionamentos. Constrói uma URL fixa em `https://warezcdn.sbs`. |
| `src/player/watch.tsx` | Um iframe por vez, recarga que desmonta o anterior, retorno seguro aos detalhes, estado de conexão e ajuda. Não interpreta mensagens do embed. |
| Embed compatível | Sem atributo sandbox. O controle experimental foi removido a pedido do usuário após diagnóstico de detecção explícita no provedor. |
| CSP e Permissions-Policy | Limitam o documento de reprodução, o domínio do frame e funcionalidades sensíveis. Aplicadas por cabeçalhos HTTP no Vite e na Vercel. |
| Documento independente | Separa o ciclo de vida e memória JavaScript da aplicação principal. Não é outra origem, uma máquina virtual, um limite de CPU ou garantia contra travamentos do navegador. |

## Iframe utilizado

```tsx
<iframe
  src={embedUrl(target)}
  title={`Player de ${title}`}
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
  referrerPolicy="strict-origin-when-cross-origin"
/>
```

O embed não recebe sandbox e não há seletor de modo. A reprodução mantém os anúncios do provedor, conforme decisão do usuário. O provedor pode abrir novas abas ou navegar a página superior conforme as regras do navegador. A interface informa que o player externo pode exibir anúncios.

O iframe continua em outra origem. A página pai limita `frame-src` ao domínio externo fixo; não recebe HTML remoto na origem do catálogo.

Permissions-Policy restringe funcionalidades sensíveis. Fullscreen é permitido pelo atributo `allow` e pelo cabeçalho HTTP.

O referrer transmite somente a origem nas solicitações entre origens. Isso reduz exposição de URLs sem remover completamente o referer, que pode ser usado pelo provedor para validar incorporações. Não substitui autorizações ou verificações legítimas.

## O que não é possível prometer

- O sandbox bloqueia comportamentos do navegador; não remove anúncios que são desenhados dentro do próprio player.
- O provedor pode detectar recursos indisponíveis. Não existe configuração universal que garanta invisibilidade ao anti-adblock e funcionamento do vídeo ao mesmo tempo.
- Sobrescrever `window.open` na página KKMovies não altera a função no iframe de outra origem. CORS também não concede acesso ao DOM desse iframe. O bloqueador legado do projeto não é utilizado pela nova rota.
- Uma CSP na página pai não sanitiza scripts, anúncios, requisições e iframes internos do documento externo.
- O evento `load` do iframe não comprova reprodução nem sucesso HTTP. Por isso a UI o usa apenas para finalizar a indicação de carregamento do documento, sem anunciar que o vídeo está funcionando ou fabricar progresso.
- O isolamento de documento não impede todo consumo excessivo de CPU/memória pelo provedor. Para separar também o armazenamento de primeiro nível, implante a entrada em uma origem dedicada, sem cookies de domínio compartilhado. Isso exige configuração de host e pode sair do escopo da PWA; não foi presumido ou implantado.

## Diagnóstico e decisão

O diagnóstico está em `embed-diagnosis.md`. O controle de bloqueio experimental e seu código foram removidos. Recarregar desmonta o iframe anterior. O site não consegue ler o status HTTP ou o DOM do iframe externo para detectar automaticamente um erro remoto.

Se for obrigatório combinar reprodução e ausência de anúncios, é necessária uma integração compatível oferecida pelo fornecedor. O modo compatível não é um bypass invisível de anti-adblock.

Não foi implementado um proxy reverso de HTML do player. Esse proxy não é uma sanitização confiável: scripts dinâmicos, URLs relativas, tokens assinados, cookies, CSP, segmentos HLS/DASH e DRM exigem uma integração específica. Servir esse HTML na origem principal ainda amplia o risco de execução de código do fornecedor com a origem da aplicação. Não se deve proxyar um player arbitrário com `allow-same-origin` na origem de KKMovies.

Referências: [sandbox do iframe e limites de mesma origem — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), [CSP sandbox — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox).

## UI e PWA

- Header, menu e Footer usam o mesmo componente `Brand`, fonte, peso, espaçamento e ponto de marca. DM Sans é a fonte de leitura; Barlow Condensed atende títulos, marca e rankings.
- As ações do hero têm um grid de duas colunas no mobile, detalhes em linha própria e uma coluna em telas muito estreitas. O conteúdo determina a altura, com indicadores no fluxo, evitando colisões entre textos, botões e paginação.
- `Synopsis` mantém o texto completo no DOM, aplica três linhas e só oferece expansão quando detecta corte real. A lista de recomendações usa o endpoint apropriado, similares como alternativa, remove duplicatas e o título atual, e oculta a seção vazia.
- Explorar separa tipo de conteúdo, filtros recolhíveis, ordenação e resultados. Inclui skeletons, estados vazios, repetição de consulta e grades horizontais/verticais responsivas.
- Manifest com `id` e `scope` em `/`, `display: standalone`, cores consistentes e `orientation: any`. Não há bloqueio de retrato durante vídeo.
- A PWA instalada pode ocultar a barra de endereço conforme o suporte do sistema. Uma aba normal continuará exibindo controles do navegador; CSS ou o manifesto não podem obrigá-la a escondê-los. [Modos de exibição — web.dev](https://web.dev/learn/pwa/app-design?hl=en).
- `/watch` fica fora do fallback de navegação e `watch.html` fora do precache. O HTML da reprodução tem `Cache-Control: no-store`. Isso mantém os cabeçalhos da resposta original e evita servir a Home como player. Sem conexão, iniciar uma nova reprodução exige rede; vídeo não é armazenado para uso offline.
- O cache de metadados atende somente `/api/movies` e `/api/series` da mesma origem. Não captura URLs arbitrárias ou streaming. O registro do service worker é único, pelo aplicativo principal. Atualizações são automáticas conforme `automatic-updates.md`; o documento do player não é recarregado por esse mecanismo.

## Verificação

`npm run check` verifica TypeScript e testes de catálogo, armazenamento, rotas, parâmetros maliciosos e equivalência de cabeçalhos de preview/produção. `npm run build` produz `index.html` e `watch.html`. A verificação automatizada de produção é `node scripts/verify-watch-build.mjs`, depois do build.

Testes de código não demonstram que cada filme ou servidor do provedor reproduz. A inspeção do embed posterior à verificação está registrada no diagnóstico, sem declarar reprodução do vídeo confirmada.
