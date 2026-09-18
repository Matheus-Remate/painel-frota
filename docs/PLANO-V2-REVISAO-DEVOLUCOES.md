# V2 — revisão de devoluções e histórico por condutor

Este documento é um modelo de produto e dados, **não** uma funcionalidade publicada na v1.

## Objetivo

Após cada devolução, um gestor revisa os dados e fotos antes de atribuir qualquer pendência ao condutor. O relato feito pelo próprio condutor não é, por si só, prova de autoria de dano: a revisão compara a condição confirmada na retirada, a devolução e eventual evidência de manutenção anterior.

## Fluxo proposto

1. O sistema abre uma revisão `PENDING` para a devolução, vinculada ao `check_in`, movimento de retirada, reserva, veículo e condutor identificado.
2. Somente gestor/administrador acessa fotos privadas e pode registrar `NO_FINDING`, `PRE_EXISTING`, `NEW_DAMAGE`, `INSUFFICIENT_EVIDENCE` ou `NEEDS_INSPECTION` para cada item.
3. Cada decisão exige descrição, gravidade, fotos/evidências usadas, responsável e data. Mudanças posteriores geram nova versão, sem apagar a decisão anterior.
4. Somente apontamentos `NEW_DAMAGE` confirmados são relacionados ao perfil do condutor anterior. Casos sem identidade verificada ou com troca de condutor declarada ficam `UNATTRIBUTED` até conferência, nunca vinculados por semelhança de nome.
5. O perfil do condutor mostra resumo de revisões, pendências abertas/resolvidas, veículos envolvidos e direito de contestação. Um resumo agregado não deve virar pontuação disciplinar automática.

## Modelo de dados sugerido

- `return_reviews`: `id`, `check_in_id`, `checkout_movement_id`, `reservation_id`, `driver_id`, `reviewer_user_id`, `status`, `reviewed_at`, `summary`, `created_at`.
- `return_review_findings`: `id`, `review_id`, `checklist_item`, `decision`, `severity`, `description`, `attribution_status`, `attributed_driver_id`, `resolved_at`.
- `return_review_evidence`: `id`, `finding_id`, `private_storage_path`, `source` (`PICKUP`, `RETURN`, `INSPECTION`), `captured_at`, `sha256`.
- `return_review_events`: registro imutável de criação, alteração, contestação e resolução, com responsável e data.

Índices principais: revisões por `check_in_id` único; achados por `attributed_driver_id` e `status`; eventos por revisão/data. RLS: somente gestores e administradores alteram revisões; o condutor vê apenas um resumo aprovado sobre si, nunca fotos de terceiros. Fotos pelo QR autenticado para gestor são uma exceção de interface da v2, sem tornar o bucket público.

## Identidade e odômetro

Na v1, o QR identifica o veículo, não a pessoa. Para atribuição confiável na v2, a alternativa recomendada à foto facial é autenticação do condutor no momento da retirada (sessão já existente ou código de uso único enviado ao contato cadastrado), com confirmação explícita de custódia. A foto do odômetro pode servir como evidência; OCR deve apenas sugerir o número para confirmação humana, preservando a imagem original e registrando correções. Reconhecimento facial só deveria ser considerado após avaliação de necessidade, consentimento/base legal, retenção e alternativa não biométrica.

## Critérios de aceite da v2

- Nenhuma foto aparece no QR público; gestor autenticado consegue consultar evidências.
- Não há atribuição automática de culpa por nome livre ou por um único relato.
- Gestor consegue concluir e revisar decisão sem perder trilha de auditoria.
- Perfil do condutor distingue ocorrência relatada, achado confirmado e contestação.
- Testes cobrem troca de condutor, ausência de foto, divergência de odômetro, duplicidade de revisão e acesso indevido.
