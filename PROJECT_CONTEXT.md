# Contexto do projeto — Painel de Frota

## Objetivo e estado de entrega

Aplicação operacional para controlar solicitações, aprovação, reservas, veículos, condutores, retirada/devolução via QR e tratamento de pendências. O MVP já foi lançado; o trabalho atual prepara a **v1** com retirada vinculada à reserva, privacidade no QR e níveis de alerta.

O `HEAD` é `87c47d9`. Há alterações locais **não commitadas e não publicadas**, incluindo as migrations `034` e `035`; trate-as como parte da v1 em andamento. Não publique o código v1 sem aplicar as migrations pendentes no Supabase.

## Arquitetura e tecnologias

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS e Lucide.
- Supabase: Auth, PostgreSQL/RLS, Storage e RPCs SQL. `@supabase/ssr` mantém sessão em browser/servidor.
- Vercel hospeda produção. QR é gerado por `qrcode`; leitura usa `html5-qrcode`.
- Server Actions em `lib/services` e `lib/actions`; use `createClient()` para sessão/RLS e `createAdminClient()` somente no servidor para operações privilegiadas/QR público.

## Estrutura a conhecer primeiro

- `app/`: rotas. `app/dashboard/*` é o painel autenticado; `app/mobile/vehicle/[id]/*` é o fluxo público por QR.
- `components/mobile/{checkout-form,return-form}.tsx`: UX de retirada/devolução.
- `lib/services/{mobile,checkins,dashboard,notifications,schedule,occurrences,settings}.ts`: regras de servidor.
- `lib/security/{authorization,user-management,auth-redirect}.ts`: RBAC, papéis e reset de senha.
- `supabase/migrations/032_secure_mobile_movements_notifications.sql` e `033_atomic_reservations.sql`: base segura já lançada.
- `supabase/migrations/034_v1_qr_pickup.sql` e `035_v1_alert_levels.sql`: v1 local pendente de aplicação.
- `docs/GUIA-DE-USO.md`: manual operacional atualizado; `docs/PLANO-V2-REVISAO-DEVOLUCOES.md`: escopo/proposta v2.
- `tests/`: testes unitários leves para QR, redirecionamento, RBAC e níveis.

## Banco e domínio

Principais tabelas: `profiles`, `vehicles`, `drivers`, `vehicle_requests`, `reservations`, `check_ins`, `vehicle_movements`, `occurrences`, `occurrence_types`, `fleet_notifications`, `brands`, `models`, `usage_categories` e `photos` (legada). Fotos novas ficam em `storage.checkin-photos`, bucket privado.

Migrations 032/033 adicionaram `vehicles.qr_access_token`, `vehicles.odometer`, `check_ins.driver_name/return_notes/photo_paths`, linha de custódia em `vehicle_movements`, notificações e RPCs transacionais.

Migrations v1 pendentes:

- `034`: `vehicles.qr_display_settings` e nova `register_vehicle_checkout(...)`, que exige reserva ativa, valida token, janela de retirada e divergências.
- `035`: `alert_level` em check-ins/ocorrências, declarações auditáveis de liberação, correções auditáveis de devolução, proteção de reserva contra alerta impeditivo e atribuição de devolução ao condutor retirante.

Aplicar migrations numeradas em ordem. Os scripts `MANUAL_FIX_*` e a duplicidade histórica de `029` são suporte legado: não os rode automaticamente em banco já atualizado.

## Autenticação e permissões

Papéis em `profiles.role`: `admin`, `gestor`, `solicitante`.

- Solicitante: cria/acompanha as próprias solicitações e perfil.
- Gestor: operação (aprovações, veículos, condutores, reservas, ocorrências, revisão), catálogos e usuários não administrativos.
- Admin: tudo do gestor; cria/altera administradores, exclui contas e trata configuração técnica.

Gestor pode criar/editar somente `gestor` e `solicitante`; UI esconde `admin` e o servidor também bloqueia tentativa forjada. Conta administrativa protegida não pode ser rebaixada/excluída. E-mail de perfil é somente leitura; alterações devem sincronizar Auth e `profiles`.

`proxy.ts` protege login/dashboard e impõe rotas de gestor; ações críticas também precisam usar `requireManager()`/`requireAdministrator()` ou guardas equivalentes. Não confie apenas na UI.

## Regras de negócio atuais

- QR contém UUID do veículo + `qr_access_token`; UUID isolado não autoriza acesso. Ao rotacionar token, administrador rotaciona e gestor reimprime/substitui o QR.
- QR público não mostra último condutor, histórico completo ou fotos. Exibe condutor/reserva prevista, horários e dados operacionais configuráveis pelo gestor (combustível, odômetro, observações, pendências).
- Retirada v1: somente com reserva ativa, até 2h antes do início e antes do fim; dados previstos vêm da reserva. Condutor/odômetro/combustível corretos são confirmados, não redigitados. Variação exige motivo e notifica gestores.
- Devolução: registra checklist, observações, combustível, odômetro, fotos e condutor. Fotos grandes são comprimidas no navegador (meta ~700 KB para caber no limite de Server Action); falha não descarta silenciosamente a foto nem confirma a devolução.
- Níveis: `URGENT` não roda; `HIGH` não viaja; `MEDIUM` viaja com atenção; `LOW` viaja ciente da pendência. Urgente/alto bloqueiam retirada e criação/alteração de reserva no banco; médio/baixo não cancelam reservas.
- Rebaixar urgente/alto para médio/baixo exige justificativa e confirmação de declaração, gravada com gestor, placa, pendência e data. Resolver reparo é diferente de reclassificar alerta.
- Notificações internas chegam a gestor/admin para retirada, devolução, divergência e urgência com reserva em até 48h. A urgência é derivada e reaparece enquanto o painel estiver aberto (poll de 60s).
- Correções de dados de devolução devem ser auditadas; nunca sobrescrever silenciosamente linha de custódia. A RPC prevista só aceita a última devolução sem retirada posterior.

## Funcionalidades implementadas

Já lançadas no baseline: login/reset com URL de produção, RBAC básico, solicitações/aprovações, reservas atômicas, veículos/condutores, QR tokenizado, check-in/devolução, bucket privado, custódia, notificações e conta admin protegida.

A v1 está publicada: gestão de usuários por gestor com restrições, QR orientado à reserva, ocultação configurável de dados de QR, compressão de foto, níveis de alerta e decisões auditáveis, lembrete de urgência/reserva, edição de reserva com condutor explícito e documentação v1/v2. A correção auditável de devolução possui formulário no painel e histórico consultável (gestor, data, valores anterior/novo e justificativa). A migration `035` protege alterações de reserva ativa contra alertas impeditivos tanto no gatilho quanto na RPC de edição.

## Pendências e problemas conhecidos

- Em 2026-09-17, a leitura de perfil no cliente passou a ter fallback RLS após a RPC `get_my_profile`; o listener de Auth também agenda essa leitura fora do callback do Supabase para evitar bloqueio de sessão. A função, a permissão `authenticated` e a leitura RLS do perfil de produção foram verificadas antes da publicação.

- As migrations `034` e `035` foram aplicadas com sucesso no Supabase de produção em 2026-09-17, via SQL Editor. O histórico gerenciado legado do projeto ainda lista somente `001`–`003`, embora o schema já contivesse as bases de `032`/`033`; não use essa listagem isoladamente para inferir o estado real do banco.
- A v1 ainda precisa de validação E2E real: QR/reserva, divergência, devolução com 5 fotos, cada nível de alerta, reclassificação, reserva próxima e permissões por papel.
- Migrations v1 são extensas e precisam de revisão SQL/staging antes de produção; não há `psql`/CLI Supabase configurado no workspace para executá-las localmente.
- Cobertura de testes é unitária e pequena, incluindo teste de contrato estático da proteção de reserva na migration `035`; faltam testes de integração contra PostgreSQL/Supabase e E2E de navegador.
- `npm test` pode falhar com `spawn EPERM` no sandbox, mas passou fora dele. Build exige variáveis Supabase; com valores fictícios compilou/paginou corretamente.
- Há componentes/rotas legados (`mobile/checkin`, `pickup-form`, `report-list`, `photos`) que não devem voltar a expor fotos/histórico no QR. Avaliar remoção/refatoração somente após confirmar que não há uso em produção.
- V2 de revisão/atribuição a condutor é proposta apenas; não implementar culpa/pontuação automática sem o fluxo de evidência e contestação do documento.

## Integrações e ambiente

Necessárias (não registrar valores):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor; nunca prefixar com `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`

Em produção, as URLs públicas devem apontar para `https://painel-frota.vercel.app`. No Supabase Auth, configurar Site URL e Redirect URL para `/reset-password`. Storage usa `checkin-photos` privado e `avatars` conforme políticas do projeto.

## Comandos

```powershell
npm install
npm run dev
npm run typecheck
npm run lint -- --quiet
npm test
npm run build
npm run setup:primary-admin
```

Para build local sem secrets reais, é possível definir valores Supabase fictícios apenas para validar compilação. Não commitar `.env.local`. Em ambiente restrito, execute testes/build fora do sandbox caso surja `spawn EPERM`.

## Próximo passo recomendado

Executar o roteiro E2E por papel e QR em ambiente de homologação com backup lógico antes de qualquer dado de teste. Depois, priorizar testes de integração SQL e decidir o escopo da V2 de revisão de devolução.

## Registro obrigatório de mudanças

Toda alteração futura deve atualizar `docs/REGISTRO-DE-MUDANCAS.md` no mesmo commit, com: data, escopo, impacto operacional, migrations/alterações de dados, backup realizado ou justificativa para não realizá-lo, validações executadas, commit e estado de publicação. Mudanças com escrita, exclusão ou migração de dados exigem backup lógico recuperável antes da execução; exceções devem ser justificadas no registro.
