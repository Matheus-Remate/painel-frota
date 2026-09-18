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
- Publicação: pendente da conclusão das validações desta mudança.
