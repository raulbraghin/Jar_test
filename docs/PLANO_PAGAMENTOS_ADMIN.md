# Sistema de Cobrança + Administração — Jar Test (Mercado Pago)

> **Status:** 📋 Aguardando aprovação da equipe  
> **Data de elaboração:** 2026-09-05  
> **Autor:** Raul B. — Jar-Test Digital

Implementar o sistema de pagamento e a **tela completa de administração** no **Jar Test**, espelhando fielmente a arquitetura já existente no **Projeto_ETA**.

---

## Contexto

O Jar Test já possui:
- `jt_users` com `plano_ate`, `plano_sempre`, `ensaios_usados`, `janela_inicio` (pronto para planos)
- `config.py` com as variáveis de preço dos planos
- `frontend/src/pages/Plano.tsx` com botões `alert("em breve")` — **a corrigir**
- `backend/app/api/v1/users.py` com apenas o endpoint `/me` — **a expandir**
- Sem tela de administração no frontend — **a criar do zero**

**Preços definidos:**

| Plano | Preço | Duração |
|-------|-------|---------|
| Mensal | R$ 4,99 | 30 dias |
| Trimestral | R$ 14,99 | 90 dias |
| Anual | R$ 49,99 | 365 dias |

---

## ⚠️ Pontos de Atenção (Revisão Obrigatória)

> **[IMPORTANTE] Mercado Pago ainda não configurado**  
> O token será inserido no `.env` futuramente. Com token vazio, o sistema exibe "Pagamentos em breve" sem quebrar nenhuma funcionalidade existente.

> **[IMPORTANTE] Webhook URL** (configurar no painel do Mercado Pago após criar conta):  
> `https://seu-dominio.com/api/v1/pagamentos/webhook`

> **[NOTA] Tela de Admin protegida por `role=admin`**  
> Tanto no backend (middleware `require_role("admin")`) quanto no frontend (rota `AdminOnly` que redireciona usuários comuns).

> **[NOTA] Limite do plano gratuito**  
> 3 ensaios por janela de 7 dias (`LIMITE_GRATIS_ENSAIOS=3`, `JANELA_GRATIS_DIAS=7`). Já configurado no `config.py` — será aplicado no endpoint de criação de ensaios.

---

## Mudanças Propostas

---

### 1 — Backend: Pagamentos

#### [NEW] `backend/app/models/pagamento.py`

Modelo SQLAlchemy — tabela `jt_pagamentos`:
- `id` UUID PK, `user_id` FK→`jt_users`, `mp_payment_id` (único, idempotência), `tipo`, `valor`, `status`, `criado_em`, `aprovado_em`

---

#### [MODIFY] `backend/app/models/user.py`

- Adicionar `relationship("Pagamento", back_populates="user", cascade="all, delete-orphan")`
- Renomear campo `ensaios_usados` → `dimensionamentos_usados` (consistência com `planos.py` do Projeto_ETA)

---

#### [MODIFY] `backend/app/models/__init__.py`

- Importar `Pagamento` para que `Base.metadata.create_all` crie a tabela `jt_pagamentos`

---

#### [NEW] `backend/app/services/mercadopago.py`

- `criar_preferencia(tipo, user_id)` — cria preferência Checkout Pro com `external_reference = "jt:{user_id}:{tipo}"`
- `obter_pagamento(payment_id)` — consulta pagamento na API (fonte da verdade, não confia no corpo do webhook)
- `back_urls` → `{FRONTEND_URL}/plano/status?status=success|failure|pending`

---

#### [NEW] `backend/app/services/planos.py`

- `obter_plano(tipo)`, `catalogo_planos()`, `usuario_premium(user)`, `estender_plano(user, tipo)`
- `usos_na_janela(user)`, `registrar_uso(user)` — janela deslizante de 7 dias para plano gratuito

---

#### [NEW] `backend/app/schemas/pagamentos.py`

- `CheckoutRequest`, `CheckoutResponse`, `SimularRequest`, `ConcederRequest`
- `UsoResponse`, `PlanoDisponivel`

---

#### [NEW] `backend/app/api/v1/pagamentos.py`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `POST` | `/pagamentos/checkout` | Autenticado | Cria preferência MP, retorna `init_point` |
| `POST` | `/pagamentos/webhook` | Público | IPN do MP, valida `X-Signature`, processa `approved` |
| `GET` | `/pagamentos/uso` | Autenticado | Status plano + uso gratuito + catálogo |
| `POST` | `/pagamentos/simular-ativacao` | Admin | Ativa plano sem MP (testes locais) |
| `POST` | `/pagamentos/admin/conceder` | Admin | Concede/revoga acesso manualmente |

---

#### [MODIFY] `backend/app/core/config.py`

```python
# Novos campos a adicionar
MERCADOPAGO_ACCESS_TOKEN: str = ""
MERCADOPAGO_WEBHOOK_SECRET: str = ""
MERCADOPAGO_API_BASE: str = "https://api.mercadopago.com"

# Preços corrigidos
PLANO_MENSAL_PRECO: float = 4.99
PLANO_TRIMESTRAL_PRECO: float = 14.99
PLANO_ANUAL_PRECO: float = 49.99
```

---

#### [MODIFY] `backend/requirements.txt`

- Garantir que `requests` está listado (necessário para chamadas à API do Mercado Pago)

---

#### [MODIFY] `backend/app/api/v1/ensaios.py`

- Verificar limite gratuito ao salvar resultados usando `planos.usos_na_janela` e `planos.registrar_uso`
- HTTP 402 com mensagem clara quando limite atingido

---

### 2 — Backend: Administração de Usuários

#### [MODIFY] `backend/app/api/v1/users.py`

Expandir com endpoints admin completos (espelhando `Projeto_ETA/backend/app/api/v1/users.py`):

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `GET` | `/users/me` | Autenticado | Retorna perfil do usuário logado (já existe) |
| `GET` | `/users` | Admin | Lista todos os usuários com info de plano |
| `POST` | `/users` | Admin | Cria usuário manualmente (já verificado, sem e-mail) |
| `PATCH` | `/users/{user_id}` | Admin | Atualiza `role`, `ativo`, `nome`, `senha` |
| `DELETE` | `/users/{user_id}` | Admin | Exclui usuário (protege auto-exclusão) |

---

#### [NEW] `backend/app/schemas/user.py`

Schemas Pydantic para gestão de usuários:
- `UserCreate` — campos: `nome`, `email`, `senha`, `role` (padrão `"engenheiro"`)
- `UserUpdate` — campos opcionais: `nome`, `role`, `ativo`, `senha`
- `UserOut` — campos de saída com info de plano (centralizado aqui, reaproveitado pelo auth)

---

#### [MODIFY] `backend/app/main.py`

- Importar e registrar `pagamentos.router` no `API_PREFIX`

---

### 3 — Frontend: Pagamentos

#### [MODIFY] `frontend/src/pages/Plano.tsx`

- **Corrigir preços**: R$ 9,99 → R$ 4,99 / R$ 26,99 → R$ 14,99 / R$ 99,99 → R$ 49,99
- **Substituir `alert()`** por lógica real de checkout via `POST /pagamentos/uso` + `POST /pagamentos/checkout`
- Carregar planos dinamicamente do endpoint `/pagamentos/uso`
- Mostrar status do plano atual: data de expiração, contador de ensaios usados, barra de progresso gratuita
- Exibir card informativo "Pagamentos em breve" quando `uso.configurado === false`
- Admin vê mensagem "Acesso admin — isento de pagamento"

---

#### [NEW] `frontend/src/pages/PlanoStatus.tsx`

Página de retorno após pagamento em `/plano/status`:
- Lê `?status=success|failure|pending` da URL
- Exibe feedback visual com animação (✅ sucesso, ❌ falha, ⏳ pendente)
- Botão "Voltar ao Dashboard" ou "Tentar novamente"

---

### 4 — Frontend: Tela de Administração

#### [NEW] `frontend/src/pages/Admin.tsx`

Tela completa de administração acessível apenas por `role === "admin"`, em `/admin`.

**A) Criar Novo Usuário (formulário lateral)**
- Campos: Nome, E-mail, Senha, Perfil (admin / engenheiro)
- Cria usuário já com e-mail verificado (sem disparo de e-mail)
- Feedback de sucesso/erro

**B) Lista de Usuários**
- Tabela/lista com: Nome, E-mail, Badge de status do plano, Role, Status ativo/inativo
- Para cada usuário (non-admin), os seguintes botões de ação:

| Ação | Endpoint chamado | Comportamento |
|------|-----------------|---------------|
| **+30 dias** | `POST /pagamentos/admin/conceder` `modo=teste30` | Estende plano por 30 dias |
| **Acesso Vitalício** | `POST /pagamentos/admin/conceder` `modo=sempre` | `plano_sempre=True` (não expira) |
| **Revogar** | `POST /pagamentos/admin/conceder` `modo=revogar` | Remove plano/liberação |
| **Ativo/Inativo** | `PATCH /users/{id}` `{ativo: !u.ativo}` | Toggle de ativação da conta |
| **Excluir** | `DELETE /users/{id}` | Exclusão com confirmação |

Badge visual de status do plano:
- 🟡 **Admin** — role = admin
- 🟠 **Vitalício** — plano_sempre = true
- 🔵 **PRO até DD/MM/AAAA** — plano_ate vigente
- ⚪ **Gratuito** — sem plano ativo

---

#### [NEW] `frontend/src/components/AdminOnly.tsx`

Guard de rota: redireciona para `/` qualquer usuário com `role !== "admin"`.

---

#### [MODIFY] `frontend/src/App.tsx`

Adicionar rotas:
```
/admin        → Admin.tsx       (protegido por AdminOnly)
/plano/status → PlanoStatus.tsx (protegido por Protected)
```

---

#### [MODIFY] `frontend/src/components/Navbar.tsx`

- Adicionar link **"Admin"** na navegação desktop, visível apenas quando `user.role === "admin"`
- Badge especial `ADMIN` na navbar quando logado como admin

---

#### [MODIFY] `frontend/src/types.ts`

```ts
interface UsoResponse {
  role: string
  configurado: boolean
  pago: boolean
  plano_ate: string | null
  usados: number
  limite: number
  janela_dias: number
  liberado: boolean
  planos: PlanoDisponivel[]
}
interface PlanoDisponivel {
  tipo: string
  preco: number
  dias: number
}
```

---

#### [MODIFY] `.env.example` e `.env`

```env
# Mercado Pago (preencher após criar conta)
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_API_BASE=https://api.mercadopago.com

# Preços corrigidos
PLANO_MENSAL_PRECO=4.99
PLANO_TRIMESTRAL_PRECO=14.99
PLANO_ANUAL_PRECO=49.99
```

---

## Plano de Verificação

### Sem Mercado Pago (conta ainda não criada)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Token vazio → clicar em "Assinar" | Frontend exibe card "Pagamentos em breve" |
| 2 | `POST /pagamentos/checkout` sem token | HTTP 503 com mensagem amigável |
| 3 | Admin: simular-ativacao `tipo=mensal` | `plano_ate` = hoje + 30 dias no banco |
| 4 | Admin: conceder `modo=sempre` | `plano_sempre=True` no banco |
| 5 | Admin: conceder `modo=revogar` | `plano_sempre=False`, `plano_ate=None` |
| 6 | Admin: Inativar usuário via tela `/admin` | `ativo=False`, usuário bloqueado no login |
| 7 | Criar 3 ensaios (gratuito) → tentar 4º | HTTP 402 — redireciona para `/plano` |

### Com Mercado Pago (após criar conta)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 8 | Webhook `status=approved` | Plano estendido, registro em `jt_pagamentos` |
| 9 | Webhook duplicado (mesmo `mp_payment_id`) | Plano NÃO estendido duas vezes (idempotência) |
| 10 | Checkout real → retorno `/plano/status?status=success` | Página de sucesso com animação |

### Docker Build

```bash
cd D:\GitHub\Jar_test
docker-compose build
docker-compose up -d
```
