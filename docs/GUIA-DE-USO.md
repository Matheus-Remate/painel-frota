# Guia completo de uso e administração — Painel de Frota

## 1. Visão geral

O sistema controla o ciclo completo de um veículo: solicitação, aprovação, reserva, retirada, uso, devolução, registro de condições, tratamento de alertas e nova liberação. Existem três perfis autenticados — administrador, gestor e solicitante — além do acesso operacional pelo QR afixado no veículo.

Endereços de produção:

- Acesso ao painel: `https://painel-frota.vercel.app/login`
- Recuperação de senha: `https://painel-frota.vercel.app/forgot-password`
- Fluxo móvel: aberto somente pelo QR válido de cada veículo.

## 2. Perfis e permissões

### Solicitante

O solicitante acessa **Minhas solicitações** e **Meu perfil**. Pode criar uma solicitação informando evento/finalidade, período e condutor, acompanhar o estado pendente/aprovado/negado, alterar uma solicitação ainda permitida pelo fluxo e cancelar a própria solicitação. Não administra veículos, pessoas, ocorrências, reservas ou configurações.

Passo a passo:

1. Entre com e-mail e senha.
2. Abra **Minhas solicitações** e selecione **Nova solicitação**.
3. Informe período real de retirada e devolução, finalidade e condutor.
4. Envie e aguarde a decisão do gestor.
5. Se aprovada, confira o veículo atribuído e o período.

### Gestor

O gestor possui as funções do solicitante e administra a operação: aprova/nega pedidos, associa veículo, agenda reservas, cadastra veículos e condutores, consulta devoluções, trata alertas e ocorrências e recebe notificações no sino do cabeçalho.

Também é responsável por criar contas e perfis em **Configurações > Usuários**, atribuindo o papel correto de **gestor** ou **solicitante**. A opção **Administrador** não aparece para o gestor; somente um administrador pode criar ou alterar contas administrativas. O gestor mantém as marcas, modelos, categorias de uso e tipos de ocorrência em **Configurações** e reimprime o QR do veículo após a rotação do token. A exclusão de contas e a rotação do token permanecem tarefas administrativas.

Rotina recomendada:

1. Abra **Aprovações** e confira período, finalidade e condutor.
2. Ao aprovar, escolha um veículo disponível. A gravação da aprovação e da reserva é uma única operação; concorrência ou conflito de horário impedem a confirmação.
3. Acompanhe **Reservas** e os cartões de status.
4. Após uma devolução, abra o sino e depois **Revisão e alertas**.
5. Se houver problema, confira notas e fotos, providencie o reparo e marque o alerta como resolvido somente após a liberação física.
6. Registre ocorrências administrativas em **Lançamentos e ocorrência**.

### Administrador

O administrador possui todas as funções do gestor e administra os acessos administrativos e a configuração técnica do sistema. Deve manter pelo menos uma conta administrativa protegida e nunca compartilhar credenciais.

Responsabilidades:

- criar ou alterar contas com papel **administrador** e excluir contas quando necessário;
- revisar as políticas de acesso do Supabase e as variáveis da Vercel;
- aplicar migrations em ordem e validar antes de produção;
- rotacionar o token de acesso do veículo quando necessário e avisar o gestor para reimprimir o QR;
- conferir logs de autenticação quando houver falha de login ou recuperação.

O e-mail exibido em **Meu perfil** é somente leitura. Alterações de e-mail devem ser feitas administrativamente e sincronizadas entre Supabase Auth e `profiles`.

## 3. Fluxo por QR Code

Cada veículo possui `qr_access_token`, uma credencial aleatória embutida no endereço do QR. O UUID do veículo sozinho não abre seus dados. Se o papel for fotografado, perdido ou compartilhado indevidamente, o administrador deve gerar um novo token no banco; em seguida, o gestor deve reimprimir e substituir o QR afixado no veículo.

### Retirada

1. Escaneie o QR afixado no veículo.
2. A tela mostra o condutor previsto na reserva e as datas/horas de retirada e devolução; **não** mostra o nome do último condutor. Também pode mostrar odômetro, combustível, observações e pendências da última devolução, conforme as opções do gestor em **Editar veículo > Dados exibidos no QR**. Placa, reserva e bloqueios de segurança não podem ser ocultados.
3. A retirada fica disponível na janela de duas horas antes do início da reserva até seu término, se o veículo estiver no pátio e sem alerta impeditivo.
4. Confirme os dados já preenchidos. Se outro condutor assumir ou odômetro/combustível divergirem, marque **Há divergência**, altere o dado e descreva o motivo. O gestor recebe o alerta da variação. Observações sem divergência também podem ser registradas.
5. Confirme que conferiu os dados exibidos. O sistema salva o movimento `CHECKOUT`, vincula a reserva, muda o veículo para `ON_ROUTE` e notifica administradores e gestores.

O gestor altera o condutor previsto e os horários na edição da reserva, com verificação de conflito. Para corrigir odômetro, combustível ou observações da última devolução, usa **Revisão e alertas > Corrigir dados QR** e informa o motivo. A correção preserva valores anteriores, responsável e horário em `checkin_data_corrections`; o movimento original de custódia permanece como evidência. A correção é bloqueada se já houve outra retirada.

Não é necessário redigitar nome e odômetro quando os dados estão corretos. O nome de outro condutor informado por texto não é automaticamente vinculado a um perfil; o gestor deve conferir a identidade e regularizar a reserva. OCR do odômetro e verificação facial ainda não integram a v1.

### Devolução

1. Escaneie o mesmo QR. A opção **Devolução** só aparece quando o veículo está em uso.
2. Confira o nome pré-preenchido da retirada e informe odômetro final e combustível.
3. Revise limpeza, motor, pneus/lataria, freios e outros itens.
4. Para cada item em **Revisar**, descreva o problema, classifique a gravidade e anexe foto quando ela ajudar a comprovar a condição. Fotos acima de 5 MB são reduzidas no navegador antes do envio; se a redução falhar, a devolução não prossegue sem avisar, e a foto deve ser escolhida novamente.
5. Use **Observações gerais** para chave, abastecimento, local de estacionamento ou informação ao próximo condutor.
6. Confirme a devolução. A tela informa que os dados foram salvos e o gestor notificado.

Se todos os itens estiverem OK, o veículo volta ao pátio. Pendências **urgentes** ou **altas** bloqueiam novas viagens; alertas **médios** ou **baixos** permanecem visíveis, mas não cancelam reservas futuras automaticamente. O gestor recebe a notificação da devolução e deve classificar/revisar cada pendência.

### Níveis de atenção da v1

- **Urgente:** não pode rodar (ex.: pneu furado, veículo quebrado, colisão com risco). Se houver reserva nas próximas 48 horas, o sino mantém um aviso recorrente a cada atualização do painel até a pendência ser resolvida ou reclassificada.
- **Alto:** não pode viajar; é necessária correção ou decisão formal do gestor antes de nova saída.
- **Médio:** pode viajar com atenção; o problema precisa de acompanhamento e prazo de tratamento.
- **Baixo:** pode viajar com ciência de que há item a fazer, como manutenção preventiva próxima.

Reparo concluído é diferente de reclassificação. Ao reduzir um alerta urgente/alto para médio/baixo, o gestor deve justificar e confirmar uma declaração com seu nome, a placa e a pendência, assumindo que liberou o veículo para circular. O sistema guarda nível anterior, novo nível, justificativa, declaração, responsável e horário. A declaração não substitui avaliação mecânica ou exigências legais de segurança.

O mesmo critério vale para **Lançamentos e ocorrência**: o gestor escolhe o nível ao abrir o registro e pode reclassificá-lo pelo menu **Classificar alerta**, com justificativa e declaração quando houver liberação de um impedimento.

## 4. O que fica salvo

`vehicle_movements` mantém a linha de custódia com tipo de movimento, veículo, nome do condutor, odômetro, combustível, observações, fotografia lógica das condições e data/hora. `check_ins` preserva a devolução detalhada, checklist, alertas, notas, caminhos privados das fotos, resolução e responsável pela resolução. `vehicles` mantém o odômetro consolidado e o estado operacional atual.

As fotos novas são guardadas no bucket privado `checkin-photos`. Somente gestor e administrador veem fotos no painel de revisão; a página pública do QR não gera links de fotos nem mostra histórico de condutores. O acesso do gestor pelo próprio QR com autenticação fica para a v2.

Exclusão de veículo é arquivamento lógico por `deleted_at`: ele sai das telas operacionais, mas reservas, devoluções, ocorrências e histórico permanecem para auditoria.

## 5. Notificações do gestor

O sino mostra notificações individuais para cada administrador/gestor:

- veículo retirado, com condutor e placa;
- veículo devolvido sem novo alerta;
- veículo devolvido com item para revisão.
- divergência declarada na retirada;
- urgência em veículo com reserva nas próximas 48 horas (lembrete persistente, atualizado a cada minuto enquanto o painel está aberto).

Abrir o painel do sino marca os itens não lidos como lidos. As notificações apontam para a tela operacional relacionada. São notificações internas; não são e-mail, SMS ou push do navegador.

## 6. Estados do veículo

- `IN_YARD` — no pátio e liberado para retirada.
- `ON_ROUTE` — custódia iniciada; apenas devolução é permitida pelo QR.
- `AWAITING_REPAIR` — exibido como **Bloqueado para revisão** quando há alerta urgente/alto; retirada bloqueada.
- `IN_MAINTENANCE` — manutenção/arquivamento operacional; retirada bloqueada.

Nunca altere o estado diretamente para contornar um alerta. A validação da retirada e da nova reserva também confere pendências impeditivas no banco.

## 7. Reservas e solicitações

Aprovação e criação de reserva usam funções transacionais no PostgreSQL. Um bloqueio por veículo impede que dois gestores aprovem períodos conflitantes ao mesmo tempo. O intervalo considera conflito quando a reserva existente começa antes do fim solicitado e termina depois do início solicitado; períodos apenas adjacentes são aceitos.

## 8. Login e recuperação de senha

Falhas de login sempre exibem **E-mail ou senha inválidos**, sem revelar qual campo existe. Após autenticação, uma navegação completa garante que o cookie seja reconhecido imediatamente. O link de recuperação deve voltar para `/reset-password` na URL de produção e essa rota é pública; ela não exige login anterior.

No Supabase, mantenha **Site URL** em `https://painel-frota.vercel.app` e inclua `https://painel-frota.vercel.app/reset-password` em Redirect URLs. Se aparecer `email rate limit exceeded`, aguarde a janela de limite ou configure SMTP próprio; não repita envios sucessivos.

## 9. Administração técnica

### Variáveis obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — somente servidor
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`

### Publicação segura

1. Faça backup do banco.
2. Aplique as migrations pendentes na ordem.
3. Inclua as migrations 034 e 035 na mesma janela de publicação da v1, antes do código. Rode `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e `npm audit`.
4. Publique na Vercel.
5. Teste login, solicitação, aprovação, QR de um veículo de teste, retirada, devolução com e sem alerta e resolução.
6. Confirme que o bucket `checkin-photos` está privado e que fotos aparecem apenas no painel autenticado.

### Cabeçalhos e limites

A aplicação envia CSP, bloqueio de enquadramento, `nosniff`, política de referenciador e restrição de recursos do navegador. Server Actions aceitam até 12 MB; cada foto do fluxo móvel é limitada a 5 MB.

## 10. Diagnóstico operacional

- **QR abre página inexistente:** reimprima o QR após aplicar a migration 032; QRs antigos sem token deixam de ser válidos por segurança.
- **Retirada bloqueada:** confirme janela da reserva, status e alertas urgente/alto; o gestor precisa resolver ou classificar formalmente a causa.
- **Foto não aparece:** confira bucket privado, caminho salvo em `photo_paths` e políticas; o link assinado expira e deve ser gerado novamente pela página.
- **Reserva não aprova:** confira vínculo do condutor, período e conflitos existentes.
- **Usuário entra sem menu esperado:** confira uma única linha correspondente em `profiles`, com o `user_id` correto e papel `admin`, `gestor` ou `solicitante`.
- **Recuperação volta para localhost:** corrija URL pública na Vercel e a configuração de URL/redirect no Supabase.

## 11. Checklist diário do gestor

- conferir notificações e devoluções recentes;
- tratar veículos em aguardando reparo;
- validar reservas das próximas 24 horas;
- verificar CNHs próximas do vencimento;
- conferir divergências de odômetro/combustível;
- manter observações de devolução claras para o próximo condutor.
