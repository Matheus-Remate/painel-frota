# Registro de mudanças e validações

Este arquivo é obrigatório para toda mudança funcional, de banco, segurança, operação ou publicação. Atualize-o no mesmo commit da alteração.

## Modelo obrigatório

### AAAA-MM-DD — título curto

- Escopo:
- Impacto operacional:
- Dados e migrations:
- Backup: realizado (local/data/localização) ou não aplicável (justificativa).
- Validação: testes, build, checagens de banco e fluxo manual executados.
- Publicação: commit, branch, ambiente e resultado.

## 2026-09-17 — ajuste de densidade do centro de comando e busca instantânea

- Escopo: corrigida a largura dos indicadores do Dashboard; reordenada a coluna operacional em Reparos e alertas, Aprovações e QR; adicionado seletor de veículo com prévia do QR; adicionadas buscas instantâneas global e em Veículos. A busca de Revisões continua filtrando durante a digitação.
- Impacto operacional: a tela passa a manter reparos, liberações pendentes e despacho QR na mesma coluna e na ordem de decisão; gestores encontram veículos e condutores sem sair da barra de busca.
- Dados e migrations: nenhuma migration ou alteração de dados.
- Backup: não aplicável, pois não há escrita, exclusão ou alteração de schema.
- Validação: `npm run typecheck` e `npm run build` com variáveis Supabase neutras de compilação.
- Publicação: pendente de commit e envio para `main`.

## 2026-09-17 — shell Ops Command e centro de comando da frota

- Escopo: substituída a navegação lateral do painel autenticado por uma barra operacional horizontal; redesenhado o Dashboard com indicadores, escala de alocação, atalhos para QR/despacho, eventos críticos e fila de aprovações.
- Impacto operacional: gestores e administradores passam a acessar a operação diária e as rotas prioritárias a partir de uma estrutura única, responsiva e orientada a status; nenhuma regra de reserva, QR, aprovação ou alerta foi alterada.
- Dados e migrations: nenhuma migration ou alteração de dados.
- Backup: não aplicável, pois a alteração é exclusivamente de apresentação e navegação.
- Validação: `npm run typecheck` e `npm run build` com variáveis Supabase neutras de compilação.
- Publicação: pendente de commit e envio para `main`.

## 2026-09-17 — v1: retirada por reserva, alertas e auditoria

- Escopo: retirada vinculada à reserva via QR, privacidade configurável do QR, compressão de fotos, alertas `URGENT/HIGH/MEDIUM/LOW`, reclassificações auditáveis, edição protegida de reservas e correção auditável de devoluções.
- Impacto operacional: veículos com alerta urgente/alto não podem ser retirados nem receber reserva ativa; gestores registram justificativa e declaração de liberação quando reduzem o nível de bloqueio.
- Dados e migrations: `034_v1_qr_pickup.sql` e `035_v1_alert_levels.sql` aplicadas no Supabase de produção. Foram adicionadas configurações de QR, níveis de alerta, declarações e histórico de correções.
- Backup: não criado nesta execução. As migrations foram incrementais, não removeram registros e o schema já continha as dependências de `032/033`. Qualquer E2E futuro que escreva dados exige backup lógico antes do início.
- Validação: `npm run typecheck`, `npm run lint -- --quiet`, `npm test` (15 testes), `npm run build`, confirmação do schema no Supabase e resposta HTTP 200 em produção.
- Publicação: commit `17baf97`, branch `main`, enviado a `origin/main`; rota pública `/login` respondeu HTTP 200 pela Vercel.

## 2026-09-17 — correção de acesso e navegação duplicada

- Escopo: removido o item duplicado de Configurações na barra lateral e adicionada recuperação do perfil autenticado quando a RPC `get_my_profile` falhar temporariamente.
- Impacto operacional: gestores e administradores passam a visualizar apenas um atalho de Configurações; uma falha transitória da RPC não deve mais levar diretamente à tela “Perfil não encontrado”, pois a aplicação tenta ler somente o próprio perfil sob RLS. Foi solicitado um link de redefinição de senha para o e-mail administrativo cadastrado, sem alterar nem expor a senha anterior.
- Dados e migrations: nenhuma migration ou alteração de dados. A função `public.get_my_profile()` e a permissão de execução para `authenticated` foram verificadas no Supabase de produção; a definição anterior foi preservada por consulta lógica antes da mudança de aplicação.
- Backup: não aplicável a dados, pois não há escrita, exclusão ou alteração de schema. A definição SQL existente da função foi registrada como contingência antes da validação.
- Validação: checagem de vínculo Auth/perfil do administrador, inspeção da função e grant no Supabase, confirmação visual do envio do e-mail de recuperação em produção, typecheck, lint, 17 testes e build após a alteração.
- Publicação: commit `79b9b19`, branch `main`, enviado a `origin/main`; rota de recuperação em produção respondeu HTTP 200 após a publicação automática da Vercel.

## 2026-09-17 — correções do listener Auth e recuperação de senha

- Escopo: removida a chamada assíncrona ao Supabase de dentro do callback `onAuthStateChange`; a leitura de perfil agora é agendada após o callback encerrar. A redefinição de senha usa a sessão retornada pela troca do código e possui tempo limite de validação.
- Impacto operacional: elimina a condição em que o cabeçalho autenticado é exibido, mas o perfil do cliente fica nulo por bloqueio do cliente Supabase; o link de recuperação passa a exibir formulário ou erro recuperável, sem carregamento infinito.
- Dados e migrations: nenhuma alteração de dados ou schema. Confirmados no banco de produção o vínculo Auth/perfil de Tiago Martinez e a leitura sob a RLS do papel `authenticated`.
- Backup: não aplicável; a alteração é exclusivamente de fluxo no cliente e a consulta de validação foi encerrada com `ROLLBACK`.
- Validação: contratos automatizados do adiamento do callback e da troca de código de recuperação, typecheck, lint, testes, build e nova verificação da sessão publicada após implantação.
- Publicação: pendente da implantação desta correção.

## 2026-09-17 — serialização da recuperação de perfil

- Escopo: serializada a leitura de perfil iniciada pela sessão inicial e pelo evento de Auth; `AbortError` de troca de sessão recebe uma única repetição curta.
- Impacto operacional: impede que uma segunda consulta cancele a primeira e deixe o perfil autenticado nulo.
- Dados e migrations: nenhuma alteração de dados ou schema.
- Backup: não aplicável; mudança exclusiva no cliente.
- Validação: testes de contrato da serialização, typecheck, lint, testes e build.
- Publicação: pendente da implantação desta correção.

## 2026-09-17 — correção do bloqueio de perfil no listener Auth

- Escopo: removida a chamada assíncrona ao Supabase de dentro do callback `onAuthStateChange`; a leitura de perfil agora é agendada após o callback encerrar.
- Impacto operacional: elimina a condição em que o cabeçalho autenticado é exibido, mas o perfil do cliente fica nulo por bloqueio do cliente Supabase.
- Dados e migrations: nenhuma alteração de dados ou schema. Confirmados no banco de produção o vínculo Auth/perfil de Tiago Martinez e a leitura sob a RLS do papel `authenticated`.
- Backup: não aplicável; a alteração é exclusivamente de fluxo no cliente e a consulta de validação foi encerrada com `ROLLBACK`.
- Validação: contrato automatizado do adiamento do callback, typecheck, lint, testes, build e nova verificação da sessão publicada após implantação.
- Publicação: pendente das validações desta correção.
