# Versão para navegador de Smart TV

O mesmo front-end ativa o modo TV ao reconhecer assinaturas de Tizen, webOS/NetCast, HbbTV, VIDAA, BRAVIA, Android/Google TV, Fire TV e Roku no user agent. A identificação é heurística: resolução grande ou Android sozinho não significam TV. Em Preferências (engrenagem), Automático / TV / Padrão permite corrigir a identificação. A escolha fica no dispositivo; com armazenamento indisponível, dura até recarregar.

O modo TV oferece menu lateral, margens para a tela, quatro colunas no catálogo, cartazes maiores nos carrosséis e contorno de foco. Setas movem o foco pela posição dos elementos e rolam o conteúdo. OK abre os detalhes do cartaz, onde estão as ações de assistir e lista. Voltar fecha primeiro a janela aberta; fora dela, retorna na navegação interna ou ao início. Suporta Escape, BrowserBack e códigos 10009 (Samsung) e 461 (LG). Na busca, OK usa o teclado nativo; cima/baixo sai do campo. Em seletores, cima/baixo altera opções e esquerda/direita sai. Ao editar, Voltar sai do campo antes de sair da página.

O documento isolado de reprodução recebe o modo TV e a navegação da barra do KKMovies. O iframe continua externo: eventos de teclado internos não atravessam a origem, e áudio, fullscreen, legendas, anúncios e navegação dentro do vídeo dependem do provedor. Não é um aplicativo empacotado para lojas Tizen/webOS/Android TV. Navegadores antigos podem não suportar APIs já usadas pelo aplicativo (por exemplo, dialog e ResizeObserver).

## Validação

`node --test frontend/tests/tv-navigation.test.mjs` testa identificação, códigos de controle, direção e limites. `npm run build` verifica TypeScript e os dois documentos de produção.

Validar em aparelhos reais (720p/1080p/4K): identificação automática, alternância de modos e recarga; todas as rotas do menu; rolagem horizontal e vertical com setas; busca com teclado nativo; filtros e temporadas; abrir/fechar preferências, trailer e confirmação de reprodução; Voltar em entrada direta e após navegação; entrada e saída do iframe. Verificar também o layout padrão em desktop e celular. A disponibilidade dos botões e eventos do controle varia por navegador e provedor.

## uBlock Origin

Fonte consultada: https://github.com/gorhill/uBlock (README, 10/09/2026).

uBlock Origin é uma extensão com permissões do navegador, não um script que o site possa instalar no navegador do visitante. O README recomenda Firefox (desktop/Android), informa a remoção da versão original da Chrome Web Store e aponta o uBlock Origin Lite para o ecossistema MV3. TVs precisam de um navegador que aceite extensões; muitos navegadores de TV não aceitam.

Mesmo o núcleo de filtragem não dá a uma página as permissões necessárias para interceptar solicitações do iframe de outra origem. Não existe garantia de bloqueio indetectável: o player pode verificar recursos bloqueados ou falhas de carregamento. A alternativa previsível para reprodução sem anúncios e controles completos de TV é um provedor autorizado que ofereça essa modalidade e integração documentada. Nenhuma extensão ou filtro foi incorporado nesta alteração.

## Menu sobreposto e tela cheia

O menu fica oculto, sem reservar espaço no catálogo. Esquerda no início de uma linha abre o painel translúcido; direita ou Voltar fecha e restaura o foco. Selecionar uma rota também fecha o menu. O hero ocupa a largura da TV, com imagem ao fundo e texto sobre um degradê.

O botão Tela cheia do KKMovies amplia o documento do player por gesto de OK/clique, com Fullscreen API padrão ou WebKit. Sem suporte ou com recusa do navegador, ocupa o viewport e informa que as barras do navegador podem permanecer. Sair da tela cheia ou Voltar (quando o evento chega ao documento principal) restaura o modo normal. O iframe também declara allowFullScreen. Eventos e restrições dentro do iframe externo continuam dependendo do provedor.

Testes de compatibilidade da tela cheia: `node --test frontend/tests/fullscreen.test.mjs`.


O catálogo mantém um indicador fixo de Menu na margem esquerda, com ícone e seta. Ele aceita clique e OK e informa a relação com o painel por aria-controls/aria-expanded. O painel oferece botão Fechar e fechamento ao clicar fora. A abertura prioriza a rota ativa; a margem dos conteúdos preserva espaço para o indicador. A busca, as legendas dos cartazes e os estados de foco têm tamanhos e contraste próprios para TV.


## Ghostery Adblocker — análise de integração (11/09/2026)

Fontes oficiais:
- https://github.com/ghostery/adblocker
- https://github.com/ghostery/adblocker/tree/master/packages/adblocker
- https://github.com/ghostery/adblocker/tree/master/packages/adblocker-webextension

O núcleo é uma biblioteca JavaScript/TypeScript de filtros. A chamada engine.match identifica se uma requisição corresponde às regras; ela não concede ao front-end permissão para interceptar tráfego de outros documentos. O adaptador WebExtension é executado no background de uma extensão, enquanto Electron e Puppeteer controlam a sessão do navegador.

O KKMovies usa iframe de outra origem. Instalar o núcleo no React não bloqueia as requisições nem permite modificar o DOM dentro desse iframe; o service worker do KKMovies também não controla esse documento externo. As opções tecnicamente aplicáveis são uma extensão instalada pelo usuário em navegador compatível ou um aplicativo com uma camada própria de interceptação suportada pela plataforma. Electron é uma alternativa para desktop, não um pacote que se instale diretamente nos navegadores Tizen/webOS. Nenhuma opção garante ausência de detecção pelo provedor.

Conclusão: o repositório serve como componente de uma extensão/aplicativo, mas não atende ao bloqueio transparente dentro do site atual. Não foi adicionada dependência sem efeito sobre o player.

## Refinamento de reprodução e detalhes

A reprodução agora tem uma única barra com identificação do título, retorno, recarga, ajuda recolhida e tela cheia. O vídeo ocupa o espaço restante do viewport; o carregamento tem uma apresentação própria, e mensagens de falha de conexão/demora continuam visíveis. Os estilos da reprodução, inclusive TV, ficam em player/watch.css.

Os detalhes de filme e série compartilham composição de cartaz, fundo amplo, título e ações dimensionadas para TV. Os episódios usam três colunas, com temporada, busca e ordenação acima da grade. Escolher episódio move também o foco para a temporada. A confirmação de reprodução usa imagem de fundo no modo TV e inicia o foco em Assistir agora.

## Acesso à instalação do bloqueador

Preferências e Ajuda do player oferecem links oficiais conforme o navegador. Firefox recebe uBlock Origin; Chrome e Edge recebem uBlock Origin Lite; Safari recebe a página oficial da App Store. TVs, navegadores desconhecidos e dispositivos móveis sem compatibilidade confirmada recebem documentação. A instalação só ocorre após a confirmação do visitante na loja. O site não instala extensões remotamente, não detecta uma instalação concluída e não afirma que o bloqueador está ativo. Links foram consultados em https://github.com/uBlockOrigin/uBOL-home e https://github.com/gorhill/uBlock.
