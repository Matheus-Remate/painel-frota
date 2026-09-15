# Painel de Frota

Aplicação operacional para solicitações, reservas, veículos, condutores, retirada e devolução por QR Code. O painel usa Next.js 16, TypeScript, Supabase Auth/PostgreSQL/Storage e Vercel.

## Uso e operação

O manual completo, separado por perfil de acesso, está em [docs/GUIA-DE-USO.md](docs/GUIA-DE-USO.md). Ele também descreve o fluxo do QR, notificações, dados preservados e procedimentos administrativos.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha URL, chave pública e chave `service_role` do Supabase. A chave administrativa é exclusiva do servidor e nunca pode usar o prefixo `NEXT_PUBLIC_`.
3. Instale e valide:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

4. Execute `npm run dev` e abra `http://localhost:3000`.

## Banco de dados

As migrations ficam em `supabase/migrations` e devem ser aplicadas em ordem numérica. As migrations 032 e 033 protegem o QR com token, tornam fotos privadas, registram custódia, criam notificações e tornam reservas/aprovações atômicas.

Buckets usados:

- `checkin-photos`: privado; leitura por URL assinada temporária.
- `avatars`: imagens de perfil conforme políticas do projeto.

## Produção

Configure na Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_SITE_URL`. As duas URLs públicas devem apontar para `https://painel-frota.vercel.app` para login e recuperação de senha.

Nunca envie `.env.local`, chaves ou senhas ao Git.
