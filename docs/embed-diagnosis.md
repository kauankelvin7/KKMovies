# Diagnóstico do embed WarezCDN

Inspeção realizada em 2026-09-07 UTC na rota local `/watch/969681?type=movie`, sem alterações no código remoto e sem reaproveitar os cookies enviados na conversa.

## Evidências observadas

- A verificação do provedor foi concluída automaticamente pelo navegador. A interface de idioma e servidores apareceu. Isso comprova carregamento da interface, não reprodução do vídeo.
- Um script inline ofuscado contém o objeto `__Y`, com as funções `detectSandbox`, `clickLayer` e `clickEvent`.
- `detectSandbox` tenta verificar o atributo `sandbox` em `window.frameElement`. Também tenta atribuir `document.domain` a ele mesmo e procura a palavra `sandbox` na exceção. Há ainda uma verificação com um objeto PDF oculto, condicionada à disponibilidade do plugin PDF.
- A rotina de rejeição navega o próprio documento para `/sanbox.php?` concatenado com `document.referrer`. Isso explica o endereço com a origem localhost relatado pelo usuário.
- As rotinas de publicidade contêm uma camada de clique quase transparente e um listener de clique, ambos usando `window.open` com destino `_blank`.
- Nesta sessão também houve um TypeError em `detectSandbox`, ao tentar `appendChild` em um valor nulo. É um erro do código remoto; não demonstra que todos os anúncios ou a reprodução tenham falhado.

## Conclusão e limites

A detecção de sandbox é explícita, e não apenas uma hipótese de incompatibilidade de vídeo. Permitir somente pop-ups não elimina as outras verificações. O comportamento preciso de cada ramificação depende do navegador; não foi feito um teste de todas as combinações de permissões.

O modo compatível local permanece sem sandbox. Ele não garante bloqueio de anúncios. A aplicação pai não pode editar scripts do iframe de outra origem. Acesso de inspeção pelo navegador não concede esse poder ao JavaScript do site.

Não foram capturados cookies, tokens de sessão ou endereços de mídia neste documento. Não foi implementado proxy, alteração do player remoto ou contorno da validação humana.
