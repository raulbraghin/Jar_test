# Jar-Test Digital v2.0 — Cálculo de Dosagem, Diluições e Ensaios de Tratabilidade

Sistema completo para determinação de dosagens de produtos químicos (PAC, Hipoclorito, Alcalinizante e Fluoreto), dimensionamento hidráulico de tempos de floculação e decantação (ETA Modular e Torrezan), controle analítico de parâmetros físico-químicos da água bruta e dos jarros, e emissão de relatórios executivos de tratabilidade conforme a **Portaria GM/MS nº 888/2021**.

O projeto foi construído espelhando fielmente o padrão de arquitetura, identidade visual e robustez do **Projeto_ETA**, permitindo execução conjunta na mesma VPS através do Docker.

---

## 🚀 Principais Funcionalidades

1. **Modelos Hidráulicos Integrados**:
   - **ETA Modular**: Floculadores e decantadores cilíndricos com cálculo de volume e tempos de retenção hidráulica.
   - **ETA Torrezan**: Floculadores e decantadores retangulares compactos com cálculo de volume e tempos por módulo.

2. **Dosagens na Planta & Diluições para Jarro de 2L**:
   - Conversão direta da vazão das bombas dosadoras (ml/min) para a bancada do Jar Test.
   - Cálculo das doses para **Solução Concentrada (100%)**, **Solução de Trabalho a 10%** e **Solução a 1%**.
   - Procedimento de bancada com receitas para o preparo de 100 mL de cada solução.

3. **Controle Físico-Químico Completo**:
   - **Água Bruta (Antes do Teste)**: Cor Aparente (uH), Turbidez (uT / NTU), pH, Condutividade (µS/cm), Alcalinidade Total (mg/L CaCO₃) e Temperatura (°C).
   - **Resultados dos Jarros (Pós-Ensaio)**: Cor Aparente, Turbidez, pH, Cloro Residual Livre, Flúor, Condutividade, Alcalinidade residual, tamanho do floco e velocidade de sedimentação.
   - Cálculo automático da **eficiência de remoção (%)** de Turbidez e Cor em tempo real.
   - Identificação e recomendação do **Jarro Ótimo** em conformidade com o padrão de potabilidade.

4. **Autenticação Segura & E-mail de Confirmação**:
   - Cadastro de usuários com envio automático de token de verificação via SMTP configurável (ver `.env.example`).
   - Autenticação via JWT (Access + Refresh Token) com interceptores no frontend.
   - Após o primeiro login, o usuário completa o perfil obrigatório (nome, sobrenome, e-mail, CPF) + dados opcionais (telefone, empresa/faculdade, formação, cargo, endereço).
   - CPF armazenado criptografado (Fernet/AES) com hash de unicidade. Ver `CPF_KEY` abaixo.
   - Contrato de licença disponível após login em `/contrato` (endpoint autenticado `GET /api/v1/auth/contrato`) com registro de aceite.
   - Histórico e Dashboard por usuário (projetos e ensaios salvos).
   - Estrutura pronta para planos pagos futuros (mensal, trimestral, anual).

5. **Relatório Técnico & Executivo**:
   - Visualização moderna com paleta **Slate + Cyan** idêntica ao Projeto_ETA.
   - Suporte a **Dark Mode** e **Light Mode**.
   - Formatação pronta para impressão executiva em PDF (`window.print()`).
   - Exportação em arquivo de texto formatado (.txt).

---

## 🗄️ Coexistência no PostgreSQL com o Projeto_ETA

Ambos os projetos podem compartilhar com 100% de segurança a mesma VPS e a mesma instância do banco `eta_db`!

- **Projeto_ETA**: utiliza as tabelas `users`, `projetos`, `parametros_entrada`, etc.
- **Jar_test**: utiliza exclusivamente tabelas prefixadas com **`jt_`**:
  - `jt_users`
  - `jt_projetos`
  - `jt_configuracoes_eta`
  - `jt_dosagens_planta`
  - `jt_agua_bruta`
  - `jt_resultados_jarros`

Zero risco de colisão de nomes, chaves primárias ou permissões.

---

## 🐳 Portas e Execução com Docker

O `docker-compose.yml` foi configurado com portas independentes para não conflitar com o Projeto_ETA:

| Serviço | Porta no Host | Descrição |
|---|---|---|
| **Backend Jar Test** | `8001` | FastAPI (Projeto_ETA roda na 8000) |
| **Frontend Jar Test** | `8002` | React Nginx (Projeto_ETA roda na 80) |
| **PostgreSQL Local (dev)** | `5433` | Postgres 16 (Projeto_ETA roda na 5432) |

### Como Rodar na VPS (Conectando ao banco existente):
No arquivo `.env` na VPS:
```env
DATABASE_URL=postgresql+psycopg://eta_user:eta_password_secure@eta_postgres_db:5432/eta_db
BACKEND_PORT=8001
FRONTEND_PORT=8002
FRONTEND_URL=http://SEU_IP_OU_DOMINIO:8002
```
Em seguida execute:
```bash
docker compose up -d --build
```

### Como Rodar Localmente (com banco próprio):
```bash
docker compose up -d
```
Acesse no navegador:
- Frontend: `http://localhost:8002`
- Documentação da API: `http://localhost:8001/docs`

---

## 🛠️ Stack Tecnológica

- **Backend**: Python 3.12/3.13, FastAPI, SQLAlchemy 2.0, Psycopg 3, Pydantic v2, PyJWT, Bcrypt, Cryptography (Fernet), Alembic, Pytest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Slate + Cyan), Axios, React Router Dom v6.
- **Banco de Dados**: PostgreSQL 16.
- **Infraestrutura**: Docker & Docker Compose com Nginx Alpine.

---

## 🔑 Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha. O `docker-compose.yml` exige via `${VAR:?...}`:

```env
SECRET_KEY=sua-chave-super-secreta
CPF_KEY=  # opcional: chave Fernet base64 32 bytes. Se vazia, derivada de SECRET_KEY
# Gerar com: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM=seu_email@gmail.com

ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=sua-senha-admin
```

> Nunca commite o `.env`. O `.env.example` não contém segredos reais.

---

## 🗃️ Migrações do Banco (Alembic)

O backend usa Alembic. No startup (`app/main.py`), roda automaticamente `alembic upgrade head`.

Estrutura:
- `backend/alembic.ini` + `backend/alembic/env.py`
- `backend/alembic/versions/0001_expand_user_profile.py` — adiciona à `jt_users`: `sobrenome`, `cpf_hash` (único), `telefone`, `empresa`, `formacao`, `cargo`, endereço (`logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `cep`), `perfil_completo`, `contrato_aceito_em`.

Comandos úteis (dentro de `backend/`, com `DATABASE_URL` válida):

```bash
pip install -r requirements.txt
alembic upgrade head          # aplicar
alembic downgrade -1          # reverter última
alembic revision --autogenerate -m "descricao"  # nova migração após alterar models
```

### Endpoints de perfil/contrato

- `GET /api/v1/auth/me` — dados do usuário logado (CPF mascarado em `cpf_masked`)
- `PUT /api/v1/auth/me/perfil` — completa perfil (nome, sobrenome, email, cpf obrigatórios)
- `POST /api/v1/auth/me/contrato` — `{ "aceito": true }` registra aceite
- `GET /api/v1/auth/contrato` — retorna o `Contrato_saas.txt` (requer login)

Frontend: `/perfil` (bloqueia demais rotas até `perfil_completo=true`), `/contrato` (leitura + aceite + impressão/PDF via `window.print()`).
