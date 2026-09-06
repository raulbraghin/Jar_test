# Como testar o sistema de pagamentos — Jar-Test Digital

> Passo a passo de homologação do Mercado Pago (Checkout Pro), do plano grátis e da tela de administração.

**Atenção:** nunca commite o `.env` — ele contém o token de produção do Mercado Pago.

---

## Índice

1. [O que é possível testar localmente](#1-o-que-é-possível-testar-localmente)
2. [Subir o ambiente local](#2-subir-o-ambiente-local)
3. [Testar SEM Mercado Pago (admin + limite gratuito)](#3-testar-sem-mercado-pago-admin--limite-gratuito)
4. [Testar com Mercado Pago real, sem VPS (túnel + Sandbox)](#4-testar-com-mercado-pago-real-sem-vps-túnel--sandbox)
5. [Teste final na VPS (produção)](#5-teste-final-na-vps-produção)
6. [Verificando no banco](#6-verificando-no-banco)

---

## 1. O que é possível testar localmente

| O quê | Onde | Precisa de MP? |
|---|---|---|
| Liberação de plano (admin) | `/admin` ou API | Não |
| Catálogo e preços | `GET /api/v1/pagamentos/uso` | Não |
| Limite do plano grátis (3 ensaios / 7 dias) | Salvar ensaio | Não |
| Página `/plano` (status, barra de uso) | Frontend | Não |
| Checkout de verdade (cobrança) | Sandbox/produção | **Sim** |
| Webhook (ativação automática) | Internet pública | **Sim** |

> O **retorno** do pagamento funciona em `localhost` (o Mercado Pago redireciona o navegador do seu PC). Só o **webhook** precisa de uma URL pública (túnel ou VPS).

---

## 2. Subir o ambiente local

```bash
cd D:\GitHub\Jar_test
docker compose up -d --build
```

- Aplicação: `http://localhost:8002`
- Documentação da API (Swagger): `http://localhost:8001/docs`
- No startup, o backend roda automaticamente `alembic upgrade head` (cria a tabela `jt_pagamentos`).

Confira se subiu:
```bash
docker compose ps
docker compose logs backend
```

---

## 3. Testar SEM Mercado Pago (admin + limite gratuito)

### 3.1 Credenciais de admin

O admin inicial é criado no primeiro start com os dados do `.env`:

```env
ADMIN_EMAIL=admin@jartest.com
ADMIN_PASSWORD=<a senha do seu .env>
```

Entre em `http://localhost:8002` com o admin.

### 3.2 Testar liberação de plano pela tela `/admin`

1. Acesse `/admin` (link **Admin** na navbar — só aparece para `role=admin`).
2. Crie um usuário de teste (perfil **Engenheiro**). Ele já nasce com e-mail verificado.
3. Na lista, para esse usuário, clique:
   - **+30 dias** → libera PRO por 30 dias (`modo=teste30`);
   - **Vitalício** → `plano_sempre=True` (não expira);
   - **Revogar** → volta ao plano grátis;
   - **Desativar/Reativar** → bloqueia/libera login (`ativo`);
   - **Excluir** → remove o usuário.

> O admin não pode desativar/excluir a si mesmo (proteção no backend).

### 3.3 Testar pela API (Swagger `/docs`)

Logado como admin (autorize com o botão **Authorize**):

| Endpoint | Ação |
|---|---|
| `POST /api/v1/pagamentos/simular-ativacao` | Ativa `mensal/trimestral/anual` sem MP |
| `POST /api/v1/pagamentos/admin/conceder` | `teste30`, `sempre` ou `revogar` |
| `GET /api/v1/pagamentos/uso` | Mostra `configurado`, `pago`, `usados`, `limite`, `planos` (com os preços R$ 4,99 / 14,99 / 49,99) |

### 3.4 Testar o limite do plano grátis (sem admin)

1. Faça login com o usuário **Engenheiro** criado em 3.2.
2. Na primeira entrada ele é direcionado a `/perfil` — complete nome/sobrenome/e-mail/CPF e aceite o contrato em `/contrato`.
3. Crie um projeto (+ Novo Ensaio) e, na tela do ensaio, **salve os jarros / ensaio completo**.
4. Repita **3 vezes** (cada salvamento conta 1 ensaio na janela de 7 dias). No **4º** salvamento:
   - a API responde **HTTP 402** com `code: "LIMITE_ATINGIDO"` e o frontend redireciona para `/plano`.
5. Confira em `GET /api/v1/pagamentos/uso`: `usados = 3/3`, `liberado = false`.
6. Em `/plano`, a página mostra a barra de uso e o botão "Assinar". Com o token vazio, o card **"Pagamentos em breve"** aparece e os botões ficam desabilitados (`POST /checkout` retorna 503 `PAGAMENTOS_NAO_CONFIGURADOS`).

### 3.5 Restaurar o usuário após o teste

Pelo `/admin`, clique **Revogar** (zera plano) e, se quiser liberar de novo, **+30 dias**. A janela grátis pode ser limpa concedendo/revogando, ou aguardando os 7 dias — ou resetando `ensaios_usados`/`janela_inicio` no banco (ver seção 6).

---

## 4. Testar com Mercado Pago real, sem VPS (túnel + Sandbox)

### 4.1 (Recomendado) Usar o Sandbox para não gastar dinheiro

1. Acesse `https://www.mercadopago.com.br/developers` → sua aplicação → **Credenciais de teste**.
2. Copie o token que começa com `TEST_APP_USR-...` e ponha no `.env`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=TEST_APP_USR-...
   ```
3. Suba novamente o backend:
   ```bash
   docker compose up -d --build backend
   ```
4. Volte o token para produção (`APP_USR-...`) ao terminar os testes.

### 4.2 Expor o backend para o webhook (túnel)

O Mercado Pago só envia o IPN para uma URL pública. Use um túnel:

```bash
ngrok http 8001
# ou: cloudflared tunnel --url http://localhost:8001
```

Anote a URL do túnel, ex.: `https://abc-123.ngrok-free.app`.

### 4.3 Cadastrar o webhook no painel do Mercado Pago

No painel da aplicação (a mesma usada para o token):

- **URL de notificação:** `https://SEU_TUNEL.ngrok-free.app/api/v1/pagamentos/webhook`
- **Eventos:** `payment` (e `merchant_order`, se quiser reforço)

### 4.4 Fazer a compra de teste

1. Cartões de teste do MP (aprovam na hora): ex. Mastercard `5031 4332 1540 6351`, nome `APRO`, CVV/validade qualquer.
   Referência oficial: `https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/checkout-pro-testing`
2. No app, `/plano` → **Assinar Mensal**. Você é levado ao Checkout Pro.
3. Após pagar, o MP retorna para `http://localhost:8002/plano/status?status=success`.
4. A página `/plano/status` fica em *polling* até o webhook ser processado. Quando aprovado:
   - o plano do usuário é estendido (30/90/365 dias);
   - um registro é gravado em `jt_pagamentos` (idempotente: webhooks repetidos **não** estendem duas vezes).

> Se não ativar em ~1 minuto, confira `docker compose logs backend` (procure `webhook:`). O webhook consulta o pagamento na API do MP — ele **não** confia no corpo da notificação.

---

## 5. Teste final na VPS (produção)

1. No `.env` da VPS:
   ```env
   FRONTEND_URL=https://SEU_DOMINIO_OU_IP:8002   # usado no back_url e no CORS
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   # opcional, se cadastrar o secret de assinatura:
   MERCADOPAGO_WEBHOOK_SECRET=
   ```
2. No painel do MP (produção), cadastre a notificação:
   `https://SEU_DOMINIO/api/v1/pagamentos/webhook` (evento `payment`).
3. Suba:
   ```bash
   docker compose up -d --build
   ```
4. Faça uma compra real de valor baixo (ex.: Mensal R$ 4,99) e, se for só homologação, **reembolse** no painel do MP.

> Regra de extensão: se o usuário já tem plano vigente, a nova compra é **somada** ao vencimento atual.

---

## 6. Verificando no banco

Dentro do container do banco:

```bash
docker compose exec db psql -U eta_user -d eta_db
```

```sql
-- Registros de pagamento processados (idempotência: 1 linha por mp_payment_id)
SELECT user_id, tipo, valor, status, aprovado_em FROM jt_pagamentos ORDER BY criado_em DESC;

-- Plano/uso dos usuários
SELECT email, role, plano_ate, plano_sempre, ensaios_usados, janela_inicio FROM jt_users;
```

---

## Checklist rápido

- [ ] `/admin` consegue conceder +30 dias / Vitalício / Revogar
- [ ] Usuário grátis é bloqueado no 4º ensaio (HTTP 402 → `/plano`)
- [ ] `GET /pagamentos/uso` mostra os preços R$ 4,99 / 14,99 / 49,99
- [ ] Sandbox + túnel: compra aprovada estende `plano_ate`
- [ ] Webhook duplicado não estende duas vezes
- [ ] `jt_pagamentos` recebe 1 registro por pagamento aprovado
