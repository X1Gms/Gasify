# Gasify Backend

Backend API para o sistema Gasify, uma aplicação de gestão de dispositivos de gás que permite aos utilizadores monitorizar e controlar os seus dispositivos, gerir notificações e recuperar passwords de forma segura.

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** (v5.1.0) - Framework web
- **MySQL2** (v3.15.3) - Cliente MySQL com suporte a prepared statements
- **bcrypt** (v6.0.0) - Hashing de passwords
- **jsonwebtoken** (v9.0.2) - Autenticação JWT
- **nodemailer** (v7.0.11) - Envio de emails
- **swagger-ui-express** (v5.0.1) - Documentação API
- **nodemon** (v3.1.11) - Hot reload em desenvolvimento

## Arquitetura

O projeto segue uma arquitetura modular baseada em handlers de pedidos (request handlers), com separação clara de responsabilidades:

```
backend/
├── app.js                      # Ponto de entrada da aplicação
├── config/                     # Configurações
│   ├── options.json           # Configurações do ambiente (não versionado)
│   └── options-example.json   # Template de configurações
├── db/                        # Base de dados
│   ├── create-database.sql    # Schema da base de dados
│   └── mysql-pool.js          # Pool de conexões MySQL
├── middlewares/               # Middlewares Express
│   └── require-auth.js        # Middleware de autenticação JWT
├── request-handlers/          # Handlers de pedidos organizados por domínio
│   ├── auth/                  # Handlers de autenticação
│   │   ├── forgot-password.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── reset-password.js
│   │   └── verify-password-reset-code.js
│   └── me/                    # Handlers de gestão de utilizador
│       ├── delete-me.js
│       ├── get-me.js
│       ├── get-me-notifications.js
│       ├── update-me.js
│       └── update-me-notification.js
├── routes/                    # Definição de rotas
│   ├── auth-routes.js
│   └── me-routes.js
├── utils/                     # Utilitários
│   ├── email/                 # Utilitários de email
│   │   ├── email-helpers.js
│   │   ├── send-email.js
│   │   └── transporter.js
│   ├── dev-environment.js     # Deteção de ambiente
│   ├── random-code.js         # Geração de códigos aleatórios
│   ├── regexes.js             # Expressões regulares de validação
│   └── send-neutral-response.js # Respostas neutras anti-enumeração
└── swagger.json               # Documentação OpenAPI
```

## Fluxo Principal

1. **Inicialização**: O servidor Express é configurado em `app.js` com middlewares de parsing JSON/URL-encoded
2. **Rotas**: Rotas registadas.
3. **Autenticação**: Rotas protegidas utilizam o middleware `requireAuth` que valida tokens JWT
4. **Handlers**: Cada endpoint delega a lógica para handlers específicos organizados por domínio
5. **Base de Dados**: Queries são executadas através de um pool de conexões MySQL com prepared statements

## Como Executar o Backend

### Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **MySQL** (versão 8.0 ou superior)
- **npm** (incluído com Node.js)

### Instalação

1. **Clone o repositório e navegue para a pasta backend**:

   ```bash
   cd backend
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Configure a base de dados**:
   - Certifique-se de que o MySQL está a correr
   - Execute o script de criação da base de dados:
     ```bash
     mysql -u root -p < db/create-database.sql
     ```
   - Isto criará a base de dados `gasify` com todas as tabelas e dados de exemplo

### Configuração

1. **Crie o ficheiro de configuração**:

   ```bash
   cp config/options-example.json config/options.json
   ```

2. **Edite `config/options.json`** com as suas configurações:

   ```json
   {
     "server": {
       "port": 8081,
       "environment": "development" // "development" ou "production"
     },
     "database": {
       "host": "localhost",
       "user": "root",
       "password": "sua_password_mysql",
       "database": "gasify",
       "connectionLimit": 10
     },
     "auth": {
       "saltRounds": 12 // Rounds de hashing bcrypt
     },
     "jwt": {
       "secret": "seu_jwt_secret_seguro",
       "expiresIn": "7d" // Duração do token (ex: "7d", "24h")
     },
     "nodemailer": {
       "host": "smtp.gmail.com",
       "port": 587,
       "secure": false,
       "auth": {
         "user": "seu_email@gmail.com",
         "pass": "sua_app_password"
       }
     },
     "forgotPassword": {
       "codeLength": 6, // Tamanho do código de recuperação
       "codeExpirationTimeInMinutes": 5 // Tempo de expiração do código de recuperação
     }
   }
   ```

   **Notas importantes**:

   - Para Gmail, utilize uma [App Password](https://support.google.com/accounts/answer/185833) em vez da password normal
   - O `jwt.secret` deve ser uma string longa e aleatória em produção
   - Defina `server.environment` como `"production"` em ambientes de produção

### Como Iniciar o Servidor

**Modo desenvolvimento** (com hot reload):

```bash
npm run dev
```

**Modo produção**:

```bash
node app.js
```

O servidor iniciará em `http://localhost:8081` (ou a porta configurada em `options.json`).

### Configurações Opcionais

- **Porta do servidor**: Altere `server.port` em `options.json`
- **Pool de conexões**: Ajuste `database.connectionLimit` conforme necessário
- **Expiração do JWT**: Modifique `jwt.expiresIn` (formatos: "7d", "24h", "60m")
- **Expiração do código de recuperação**: Altere `forgotPassword.codeExpirationTimeInMinutes`
- **Rounds de bcrypt**: Ajuste `auth.saltRounds` (valores mais altos = mais seguro mas mais lento)

## Documentação da API (Swagger)

A documentação completa de todos os endpoints está disponível através do Swagger UI.

**Aceder à documentação**:

```
http://localhost:8081/docs
```

A documentação Swagger inclui:

- Todos os endpoints disponíveis
- Parâmetros de entrada e validações
- Exemplos de requests e responses
- Códigos de status HTTP
- Schemas de dados
- Informação de autenticação

## Segurança

O backend implementa múltiplas camadas de segurança para proteger dados sensíveis e prevenir ataques comuns.

### Prevenção de User Enumeration

**Problema**: Atacantes podem descobrir se um email existe no sistema através de respostas diferentes.

**Solução implementada**:

- Utilização da função `sendNeutralResponse()` em endpoints sensíveis
- Em **produção**: Sempre retorna a mesma mensagem genérica, independentemente de o utilizador existir
- Em **desenvolvimento**: Retorna mensagens detalhadas para debugging, incluindo dados extra
- Aplicado em: `/auth/forgot-password`, `/auth/reset-password`

**Exemplo**:

```javascript
// Produção: "If an account exists for this email, a password reset code has been sent"
// Desenvolvimento: "User not found" (com informação de debug)
```

### Validação de Dados

Todas as entradas de utilizador são validadas antes de serem processadas:

1. **Validação de Email**:

   - Regex rigoroso que valida formato de email
   - Localizado em `utils/regexes.js`

2. **Validação de Password**:

   - Mínimo 8 caracteres
   - Pelo menos uma letra maiúscula
   - Pelo menos uma letra minúscula
   - Pelo menos um número
   - Pelo menos um carácter especial
   - Regex em `utils/regexes.js`

3. **Validação de Campos Obrigatórios**:

   - Todos os handlers verificam campos obrigatórios
   - Retornam `400 Bad Request` com mensagem clara se faltarem campos

4. **Sanitização**:
   - Utilização de `mysql.format()` para prepared statements
   - Previne SQL injection em todas as queries

### Tratamento de Erros

O sistema implementa tratamento consistente de erros:

1. **Erros Internos**:

   - Nunca expõem detalhes técnicos ao cliente
   - Sempre retornam `500 Internal Server Error` com mensagem genérica
   - Detalhes completos são registados em `console.error()` para debugging

2. **Erros de Validação**:

   - Retornam `400 Bad Request`
   - Mensagens claras sobre o que está errado

3. **Erros de Autenticação**:

   - Retornam `401 Unauthorized`
   - Mensagem genérica "Invalid credentials" para prevenir user enumeration

4. **Erros de Conflito**:

   - Retornam `409 Conflict`
   - Exemplo: "Email already exists"

5. **Continuidade Silenciosa**:
   - Falhas no envio de email não bloqueiam o fluxo
   - Erro é registado mas resposta neutra é enviada ao cliente

### Fluxo de Autenticação Seguro

1. **Registo** (`POST /auth/register`):

   - Validação de todos os campos
   - Verificação de email duplicado
   - Hashing de password com bcrypt (12 rounds por defeito)
   - Password nunca é armazenada em texto simples

2. **Login** (`POST /auth/login`):

   - Comparação segura de password com bcrypt
   - Geração de JWT com payload mínimo (apenas `id`)
   - Token expira conforme configuração
   - Mensagem genérica "Invalid credentials" para email ou password incorretos

3. **Recuperação de Password**:

   - **Forgot Password** (`POST /auth/forgot-password`):
     - Gera código único de 6 caracteres
     - Código expira após tempo configurável (5 min por defeito)
     - Previne geração de múltiplos códigos válidos
     - Envia email com código formatado
   - **Verify Code** (`POST /auth/verify-password-reset-code`):
     - Valida código sem revelar se existe
     - Verifica expiração e utilização
   - **Reset Password** (`POST /auth/reset-password`):
     - Valida código novamente
     - Marca código como usado
     - Atualiza password com novo hash

4. **Rotas Protegidas**:
   - Middleware `requireAuth` valida JWT
   - Token deve estar no header `Authorization: Bearer <token>`
   - Token inválido ou ausente retorna `401 Unauthorized`
   - Payload do JWT é anexado a `req.user` para uso nos handlers

### Códigos de Resposta HTTP Utilizados

| Código | Significado           | Quando é usado                                   |
| ------ | --------------------- | ------------------------------------------------ |
| 200    | OK                    | Operação bem-sucedida (GET, PATCH)               |
| 201    | Created               | Recurso criado com sucesso (POST /auth/register) |
| 400    | Bad Request           | Validação falhou, campos em falta ou inválidos   |
| 401    | Unauthorized          | Autenticação falhou ou token inválido            |
| 404    | Not Found             | Recurso não encontrado                           |
| 409    | Conflict              | Conflito (ex: email já existe)                   |
| 500    | Internal Server Error | Erro interno do servidor (nunca expõe detalhes)  |

## Escolhas de Design e Organização

### Organização dos Request Handlers

Os handlers estão organizados por **domínio funcional** em vez de por tipo de operação:

- **`request-handlers/auth/`**: Toda a lógica relacionada com autenticação
- **`request-handlers/me/`**: Toda a lógica relacionada com gestão do utilizador autenticado

**Vantagens**:

- Coesão: Código relacionado está junto
- Escalabilidade: Fácil adicionar novos domínios
- Manutenção: Mudanças num domínio não afetam outros

**Convenção de nomenclatura**:

- Ficheiros: `kebab-case.js` (ex: `forgot-password.js`)
- Funções exportadas: `camelCase` com sufixo `Handler` (ex: `forgotPasswordHandler`)

### Middlewares

Atualmente existe um middleware principal:

- **`require-auth.js`**: Valida JWT e anexa utilizador a `req.user`

**Padrão**:

- Middlewares são funções puras e reutilizáveis
- Seguem a assinatura Express: `(req, res, next)`
- Retornam erro ou chamam `next()`

### Utilitários (Utils)

Os utilitários são funções auxiliares reutilizáveis organizadas por propósito:

1. **`dev-environment.js`**:

   - Exporta `isDevelopmentEnv` (boolean)
   - Usado para comportamento diferente entre ambientes

2. **`send-neutral-response.js`**:

   - Função genérica para prevenir user enumeration
   - Aceita mensagem de debug e produção
   - Pode incluir dados extra em desenvolvimento

3. **`random-code.js`**:

   - Gera códigos alfanuméricos aleatórios
   - Usado para códigos de recuperação de password

4. **`regexes.js`**:

   - Centraliza todas as expressões regulares
   - Facilita manutenção e reutilização

5. **`email/`**:
   - `transporter.js`: Configura cliente nodemailer
   - `send-email.js`: Função genérica de envio de email
   - `email-helpers.js`: Estilos e helpers para templates HTML

### Estratégias de Consistência

#### Mensagens de Erro e Sucesso

- **Formato JSON consistente**: Sempre `{ success: true/false, message: "..." }` ou `{ success: true, message: "...", data: {...} }`
- **Mensagens em inglês**: Todas as mensagens da API estão em inglês
- **Mensagens descritivas**: Claras sobre o que aconteceu ou o que está errado
- **Sem detalhes técnicos**: Nunca expõem stack traces ou detalhes de implementação

#### Nomenclatura

- **Variáveis e funções**: `camelCase`
- **Ficheiros**: `kebab-case.js`
- **Constantes**: `UPPER_SNAKE_CASE` (quando aplicável)
- **Tabelas de BD**: `snake_case`
- **Campos de BD**: `snake_case`

#### Comentários JSDoc

Todos os handlers incluem comentários JSDoc padronizados:

```javascript
/**
 * Descrição breve da função.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
```

**Benefícios**:

- Autocomplete em IDEs
- Documentação inline
- Type hints para JavaScript

#### Queries SQL

- **Sempre usar prepared statements**: `mysql.format(sql, params)`
- **Nunca concatenar strings**: Previne SQL injection
- **Queries legíveis**: Usar template strings multi-linha quando necessário
- **Validar contra schema**: Todas as queries devem corresponder a `db/create-database.sql`

## Dados de Teste

O script `db/create-database.sql` inclui dados de exemplo para facilitar o desenvolvimento:

**Utilizadores** (password: `aBc12345678!`):

- alice.johnson@example.com
- bob.smith@example.com
- charlie.davis@example.com
- dana.lee@example.com

**Notificações**: Exemplos de notificações lidas e não lidas

**Códigos de recuperação**: Exemplos de códigos válidos, expirados e usados

**Dispositivos**: Vários dispositivos associados aos utilizadores

---

## Suporte

Para questões ou problemas, consulte a documentação Swagger em `/docs` ou reveja os ficheiros de código-fonte que incluem comentários detalhados.
