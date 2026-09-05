# Jar Test v2.0 — Cálculo de Dosagem, Diluições e Ensaios de Tratabilidade

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
   - Cadastro de usuários com envio automático de token de verificação via Gmail SMTP (`sidecc.r.transmissao@gmail.com`).
   - Autenticação via JWT (Access + Refresh Token) com interceptores no frontend.
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

- **Backend**: Python 3.12/3.13, FastAPI, SQLAlchemy 2.0, Psycopg 3, Pydantic v2, PyJWT, Bcrypt, Pytest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Slate + Cyan), Axios, React Router Dom v6.
- **Banco de Dados**: PostgreSQL 16.
- **Infraestrutura**: Docker & Docker Compose com Nginx Alpine.
