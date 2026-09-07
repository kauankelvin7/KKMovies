# Revisão de UX e funções

## Correções aplicadas

- Explorar deriva seus filtros da URL. Links por gênero e navegação voltar/avançar deixam de depender de estado inicial desatualizado. Parâmetros inválidos recebem valores seguros antes de chegar à consulta.
- Atalhos respeitam Ctrl, Command, Alt, composição de texto, campos editáveis e modais. O atalho da busca solicita foco após a página carregar.
- O link de pular conteúdo mantém seu destino durante o carregamento das páginas. Navegações para outro caminho movem o foco para o conteúdo, preservando o foco específico solicitado pela busca.
- Modais contêm a navegação com Tab e Shift+Tab, restauram foco e rolagem e cancelam temporizadores de fechamento. Escape atua somente no último modal GlassModal.
- O banner acompanha a preferência de movimento reduzido e sincroniza Minha Lista entre abas. Gestos predominantemente verticais não trocam slides.
- Detalhes de séries sincronizam Minha Lista e limpam filtros de episódios ao trocar de série.
- Controles de slides e notificações têm áreas de toque maiores. Ações de cards ocultas não interceptam toques em dispositivos sem hover.

## Cobertura automatizada

`npm run check`: TypeScript de backend, API e frontend; testes de catálogo, armazenamento, rotas de reprodução, filtros e atalhos. Os testes de atalhos usam eventos simulados; não equivalem à validação em navegador.

`npm run build`: compilação de produção e geração da PWA.

`node scripts/verify-watch-build.mjs`: documentos das rotas, cabeçalhos, manifesto e exclusão do player do fallback do service worker.

## Limites e validações pendentes

- Não foi realizada uma nova avaliação visual manual, conforme preferência do usuário. Teclado com leitor de tela, foco dos modais, gestos reais em iOS/Android, contraste sobre diferentes capas e instalação/atualização da PWA precisam de validação nos dispositivos.
- Reprodução, anúncios e verificações humanas continuam sob controle do provedor. O site não tem confirmação confiável de tempo assistido; histórico registra acesso, e status de Minha Lista é manual.
- Minha Lista e histórico permanecem locais ao navegador. Sincronização entre dispositivos exigiria contas e persistência no servidor; não foi adicionada implicitamente.
- Testes locais não comprovam latência de produção, disponibilidade de todos os títulos nem compatibilidade de todos os servidores externos.
