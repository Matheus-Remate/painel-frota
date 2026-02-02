# 🚗 Sistema de Controle de Frota

Sistema completo de gestão de frota com interface mobile-first para condutores (check-in via QR Code) e dashboard desktop para gestores.

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel
- **Controle de Versão**: Git

## 📋 Funcionalidades

### Desktop Dashboard
- ✅ Cards de status em tempo real (Em Pátio, Em Rota, Aguardando Reparo, Em Manutenção)
- ✅ Gestão de veículos e condutores
- ✅ Histórico de check-ins
- 🔜 Calendário Gantt de reservas

### Mobile Check-in
- ✅ Scanner de QR Code
- ✅ Formulário de check-in com checklist
- ✅ Upload de fotos obrigatório para problemas
- ✅ Mudança automática de status via trigger SQL

## 🚀 Como Começar

### 1. Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, executar as migrations na ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions.sql`
3. No **Storage**, criar bucket público chamado `vehicle-photos`
4. Copiar credenciais: **Settings > API** (Project URL e anon key)

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copiar `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Editar `.env.local` com suas credenciais Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rodar o Projeto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📦 Deploy na Vercel

### Via Dashboard

1. Acessar [vercel.com](https://vercel.com)
2. **Import Project** do GitHub
3. Configurar variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (será a URL da Vercel)
4. Deploy!

### Via CLI

```bash
npm install -g vercel
vercel login
vercel
```

## 📁 Estrutura do Projeto

```
painel-frota/
├── app/
│   ├── dashboard/          # Dashboard desktop
│   ├── mobile/             # Interface mobile
│   └── page.tsx            # Página inicial
├── components/
│   ├── dashboard/          # Componentes do dashboard
│   └── mobile/             # Componentes mobile
├── lib/
│   ├── supabase/           # Clientes Supabase
│   ├── services/           # Lógica de negócio
│   └── utils/              # Utilitários (QR Code)
└── supabase/
    └── migrations/         # SQL migrations
```

## 🔐 Autenticação

O sistema usa **Supabase Auth**. Para adicionar autenticação:

1. No Supabase Dashboard: **Authentication > Providers**
2. Habilitar Email/Password ou Social Login
3. Implementar páginas de login/signup

## 📸 Upload de Fotos

As fotos são armazenadas no **Supabase Storage** no bucket `vehicle-photos`.

Estrutura: `{check_in_id}/{timestamp}.{ext}`

## 🔄 Fluxo de Check-in

1. Condutor escaneia QR Code do veículo
2. Preenche formulário de check-in
3. Se houver "Alerta" ou "Dano":
   - Upload de fotos é obrigatório
   - Descrição do problema é obrigatória
   - **Trigger SQL automático** muda status para "Aguardando Reparo"
   - Reservas futuras são canceladas
4. Se tudo estiver "OK":
   - Veículo volta para status "Em Pátio"

## 🗄️ Banco de Dados

### Tabelas Principais

- `vehicles` - Ativos da frota
- `drivers` - Condutores autorizados
- `check_ins` - Registros de check-in
- `photos` - Fotos anexadas aos check-ins
- `reservations` - Reservas/alocações
- `maintenances` - Manutenções programadas

### Trigger Automático

A função `process_check_in()` é executada automaticamente ao criar um check-in e:
- Verifica se há problemas (ALERT ou DAMAGE)
- Atualiza status do veículo para AWAITING_REPAIR
- Cancela reservas futuras

## 🛣️ Roadmap

- [ ] Implementar autenticação completa
- [ ] Calendário Gantt de reservas
- [ ] Relatórios e estatísticas
- [ ] Notificações push
- [ ] Integração API Golfleet (telemetria GPS)
- [ ] PWA completo (instalação, offline)

## 📝 Licença

MIT

---

Desenvolvido com ❤️ usando Next.js + Supabase + Vercel
