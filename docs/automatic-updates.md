# Atualizações automáticas

## Arquitetura

Cada build gera um identificador único usado pelo JavaScript do catálogo, por `/version.json` e por um script de identificação importado pelo service worker. O endpoint de versão é um arquivo servido pelo mesmo deploy do frontend; não depende de um backend separado que possa publicar uma versão antes dos arquivos correspondentes.

HTML é revalidado (`no-cache`). `/version.json` e `/sw.js` usam `no-store`; assets com hash em `/assets/` podem permanecer em cache por um ano. A versão fica fora do precache e das regras de cache da API. O registro usa `updateViaCache: none`.

O worker instala o novo precache, ativa com `skipWaiting` e assume os clientes com `clientsClaim`. O catálogo consulta a versão no início, a cada cinco minutos e quando a aba volta ao foco, fica visível, retorna do BFCache ou recupera conexão. Eventos repetidos são limitados a uma consulta a cada 30 segundos, exceto mudanças de controlador, reconexão e novas tentativas de uma atualização pendente.

Antes de recarregar, o catálogo consulta o worker controlador por MessageChannel. Só aplica quando a versão do worker coincide com a versão publicada. Um worker antigo sem esse protocolo não provoca recarga às cegas. Sem service worker, a revalidação normal de HTML atende à atualização.

## Experiência do usuário

- Não há aviso nem botão para atualizar.
- A recarga aguarda a aba ficar visível, online, fora de um campo editável e sem modal ou mídia HTML em reprodução, além de dois segundos desde a última interação.
- Cada combinação versão atual/versão nova permite uma tentativa por sessão para evitar loops caso algum intermediário sirva HTML antigo. Se sessionStorage não estiver disponível, a atualização espera uma navegação normal.
- A rota `/watch` não importa o gerenciador: a reprodução não é recarregada para atualizar o catálogo.
- Apenas o cache local de metadados `kk_catalog_v2_*` é limpo na troca. Minha Lista e histórico permanecem intactos.
- Não há garantia de manter todo estado transitório que não esteja salvo ou na URL após uma recarga.

## Publicação e migração

O comportamento vale para builds de produção, incluindo a PWA instalada. O servidor de desenvolvimento continua usando o HMR do Vite.

É necessário publicar o build completo, incluindo `version.json`, `sw.js`, `sw-version-*.js` e os assets. O deploy deve ser atômico. Em hosts próprios, manter assets de versões anteriores por um período reduz falhas de chunks em abas abertas durante a troca.

Dispositivos que ainda executam o código antigo com aviso precisam carregar esta primeira versão uma vez, por recarga ou navegação normal. Um backend não consegue substituir retroativamente o JavaScript de uma aba antiga. Depois dessa migração, as próximas versões seguem o fluxo automático.

Abas fechadas, dispositivos offline e aplicativos suspensos pelo sistema operacional só verificam atualizações quando voltam a executar com conexão. Não existe atualização imediata garantida nessas condições.

## Verificação

Os testes automatizados cobrem versão igual, versão inválida, falta de conexão, worker antigo, ativação, edição/modal, preservação de dados e prevenção de loops. A verificação HTTP do build confere cabeçalhos e consistência entre a versão publicada e o worker. A transição entre dois deploys em uma PWA instalada em iOS/Android ainda requer validação no dispositivo.

Referências: [ciclo de vida do service worker](https://web.dev/articles/service-worker-lifecycle?hl=en), [atualização automática no Vite PWA](https://vite-pwa-org.netlify.app/guide/auto-update).
