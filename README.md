# Contos da Minha Cabeça

**Uma plataforma elegante e sofisticada de publicação e leitura de livros digitais, com sistema completo de monetização, verificação de faixa etária e comissionamento automático para autores.**

---

## 📋 Visão Geral

**Contos da Minha Cabeça** é uma plataforma web moderna construída com **React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL**, oferecendo uma experiência premium para leitores e autores independentes.

### Características Principais

- **Landing page elegante** com hero, destaques, categorias e call-to-action
- **Catálogo público** com busca, filtros por categoria e classificação etária
- **Verificação de faixa etária rigorosa** — bloqueio automático de conteúdo +18 para menores de 18 anos e conteúdo violento/terror para menores de 14 anos
- **Painel do autor** para submissão de livros, capítulos e acompanhamento de comissões
- **Fila de aprovação administrativa** com justificativa de rejeição
- **Sistema de assinaturas** — Leitor Básico (R$ 9,90/mês) e Leitor Premium (R$ 19,90/mês)
- **Venda individual** de livros com preço definido exclusivamente pelo administrador
- **Comissão automática de 25%** para autores por cada venda ou acesso via assinatura
- **Leitor online** com controle de fonte, modo noturno e progresso de leitura
- **Perfil de usuário** com favoritos, histórico de leitura e compras
- **Painel administrativo** completo com gestão de usuários, livros, comissões e estatísticas
- **Arquitetura de pagamento preparada** para PIX, Mercado Pago, Stripe e PayPal (estrutura de dados + fluxos implementados, sem integração ativa)

---

## 🏗️ Arquitetura

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui, Wouter (roteamento) |
| **Backend** | Express 4, tRPC 11, Node.js |
| **Banco de Dados** | MySQL/TiDB com Drizzle ORM |
| **Autenticação** | Manus OAuth 2.0 |
| **Testes** | Vitest |
| **Armazenamento** | AWS S3 (via Manus) |

### Estrutura do Projeto

```
contos-da-minha-cabeca/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                   # Páginas da aplicação
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Catalog.tsx          # Catálogo público
│   │   │   ├── BookPage.tsx         # Página individual do livro
│   │   │   ├── Reader.tsx           # Leitor online
│   │   │   ├── Profile.tsx          # Perfil do usuário
│   │   │   ├── AuthorPanel.tsx      # Painel do autor
│   │   │   ├── Plans.tsx            # Planos de assinatura
│   │   │   └── AdminPanel.tsx       # Painel administrativo
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Navegação principal
│   │   │   ├── BookCard.tsx         # Card reutilizável de livro
│   │   │   └── ui/                  # Componentes shadcn/ui
│   │   ├── App.tsx                  # Roteamento principal
│   │   └── index.css                # Tema global (cores, tipografia)
│   └── index.html
├── server/                          # Backend Express + tRPC
│   ├── routers.ts                   # Todos os routers tRPC
│   ├── db.ts                        # Query helpers do banco
│   ├── storage.ts                   # Helpers de S3
│   ├── platform.test.ts             # Testes Vitest
│   └── _core/                       # Infraestrutura (auth, OAuth, LLM, etc.)
├── drizzle/
│   ├── schema.ts                    # Schema do banco de dados
│   └── migrations/                  # Migrações SQL
├── shared/
│   ├── const.ts                     # Constantes compartilhadas
│   └── types.ts                     # Tipos TypeScript
└── package.json
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

#### `users`
Armazena dados de usuários com suporte a verificação de faixa etária.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  displayName VARCHAR(128),
  email VARCHAR(320),
  birthDate VARCHAR(10),          -- YYYY-MM-DD para cálculo de idade
  role ENUM('user', 'admin'),
  avatarUrl TEXT,
  bio TEXT,
  isBanned BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

#### `books`
Armazena informações de livros com classificação de conteúdo e controle de acesso.

```sql
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  slug VARCHAR(300) UNIQUE NOT NULL,
  authorId INT NOT NULL,
  categoryId INT,
  synopsis TEXT,
  coverUrl TEXT,
  contentUrl TEXT,
  contentRating ENUM('livre', '14+', '18+') DEFAULT 'livre',
  status ENUM('draft', 'pending', 'approved', 'rejected', 'unpublished'),
  price DECIMAL(10, 2),             -- NULL = não disponível para venda individual
  accessLevel ENUM('free', 'basic', 'premium') DEFAULT 'free',
  tags TEXT,                        -- JSON array
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  avgRating DECIMAL(3, 2),
  ratingCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### `subscription_plans`
Define os planos de assinatura disponíveis.

```sql
CREATE TABLE subscription_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,       -- "Leitor Básico" | "Leitor Premium"
  slug VARCHAR(120) UNIQUE NOT NULL,-- "leitor-basico" | "leitor-premium"
  description TEXT,
  monthlyPrice DECIMAL(10, 2) NOT NULL,
  features TEXT,                    -- JSON array
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### `subscriptions`
Rastreia assinaturas ativas dos usuários.

```sql
CREATE TABLE subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  planId INT NOT NULL,
  status ENUM('active', 'cancelled', 'expired', 'pending'),
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  paymentMethod ENUM('pix', 'mercadopago', 'stripe', 'paypal', 'manual'),
  paymentReference VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### `book_purchases`
Registra compras individuais de livros com cálculo automático de comissão.

```sql
CREATE TABLE book_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  bookId INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  commissionAmount DECIMAL(10, 2) NOT NULL, -- Automaticamente 25% do price
  paymentMethod ENUM('pix', 'mercadopago', 'stripe', 'paypal', 'manual'),
  paymentStatus ENUM('pending', 'paid', 'failed', 'refunded'),
  paymentReference VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### `author_commissions`
Rastreia comissões de autores com status de pagamento.

```sql
CREATE TABLE author_commissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  authorId INT NOT NULL,
  bookId INT NOT NULL,
  sourceType ENUM('purchase', 'access'), -- 'purchase' = venda individual, 'access' = assinatura
  sourceId INT NOT NULL,                  -- bookPurchases.id ou subscriptions.id
  amount DECIMAL(10, 2) NOT NULL,         -- 25% do valor
  status ENUM('pending', 'paid'),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### `payment_intents`
Arquitetura preparada para todos os gateways de pagamento.

```sql
CREATE TABLE payment_intents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  type ENUM('subscription', 'book_purchase'),
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('pix', 'mercadopago', 'stripe', 'paypal'),
  status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled'),
  metadata TEXT,                    -- JSON com dados específicos do gateway
  referenceId INT,                  -- subscriptions.id ou bookPurchases.id
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### Tabelas Adicionais
- `chapters` — Capítulos de livros
- `book_ratings` — Avaliações de usuários (1-5 estrelas)
- `book_favorites` — Livros favoritados
- `reading_history` — Histórico de leitura com progresso
- `book_rejections` — Motivos de rejeição de livros
- `categories` — Categorias (16 pré-populadas)

---

## 🔐 Verificação de Faixa Etária

A plataforma implementa um **sistema rigoroso de verificação de idade** baseado na data de nascimento do usuário:

### Regras de Acesso

| Classificação | Acesso Permitido | Bloqueio |
|--------------|-----------------|---------|
| **Livre** | Qualquer idade | Nenhum |
| **14+** | 14 anos ou mais | Menores de 14 anos |
| **18+** | 18 anos ou mais | Menores de 18 anos |

### Implementação

```typescript
// Helper de verificação de idade
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function canAccessContent(userBirthDate: string | null, contentRating: string) {
  if (contentRating === "livre") return { allowed: true };
  if (!userBirthDate) {
    return { allowed: false, reason: "Você precisa informar sua data de nascimento." };
  }
  const age = calculateAge(userBirthDate);
  if (contentRating === "18+" && age < 18) {
    return { allowed: false, reason: "Conteúdo restrito para maiores de 18 anos." };
  }
  if (contentRating === "14+" && age < 14) {
    return { allowed: false, reason: "Conteúdo restrito para maiores de 14 anos." };
  }
  return { allowed: true };
}
```

### Fluxo de Acesso Completo

O sistema verifica **idade + assinatura/compra** antes de liberar acesso:

1. **Verificação de Idade** — Bloqueia se a idade não atender ao `contentRating`
2. **Livros Gratuitos** — Qualquer pessoa com idade adequada pode ler
3. **Livros com Preço** — Requer compra individual OU assinatura ativa
4. **Acesso por Plano** — `basic` = Leitor Básico+, `premium` = Leitor Premium apenas

---

## 💰 Sistema de Monetização

### Planos de Assinatura

| Plano | Preço | Acesso |
|-------|-------|--------|
| **Leitor Básico** | R$ 9,90/mês | Livros gratuitos + livros do plano Básico |
| **Leitor Premium** | R$ 19,90/mês | Todos os livros (Básico + Premium exclusivos) |

### Venda Individual

- **Preço definido pelo admin** — Autores não têm controle sobre precificação
- **Comissão automática de 25%** — Calculada e registrada automaticamente em `author_commissions`
- **Arquitetura preparada** para PIX, Mercado Pago, Stripe e PayPal

### Comissão de Autores

Autores recebem **25% (1/4)** do valor por:
- **Venda individual** — Quando um usuário compra um livro específico
- **Acesso via assinatura** — Quando um assinante acessa o livro

**Exemplo:**
- Livro vendido por R$ 20,00 → Autor recebe R$ 5,00 (25%)
- Livro acessado por assinante → Comissão registrada conforme configuração

---

## 🔧 Backend — tRPC Routers

### `auth` — Autenticação

```typescript
auth.me                   // GET — Retorna usuário autenticado ou null
auth.logout               // POST — Limpa cookie de sessão
auth.updateProfile        // POST — Atualiza perfil (displayName, bio, birthDate, avatarUrl)
```

### `books` — Livros Públicos

```typescript
books.list                // GET — Lista livros aprovados com filtros (categoria, rating, busca)
books.featured            // GET — Livros mais vistos
books.topRated            // GET — Livros melhor avaliados
books.recent              // GET — Publicações recentes
books.bySlug              // GET — Livro específico por slug
books.chapters            // GET — Capítulos de um livro
books.checkAccess         // GET — Verifica se usuário pode acessar (idade + assinatura)
books.readChapter         // GET — Lê capítulo com controle de acesso
books.rate                // POST — Avalia livro (1-5 estrelas)
books.toggleFavorite      // POST — Adiciona/remove de favoritos
books.myFavorites         // GET — Livros favoritados do usuário
books.saveProgress        // POST — Salva progresso de leitura
books.readingHistory      // GET — Histórico de leitura
books.readingProgress     // GET — Progresso em um livro específico
```

### `author` — Painel do Autor

```typescript
author.myBooks            // GET — Livros do autor (todos os status)
author.submit             // POST — Submete novo livro para aprovação
author.addChapter         // POST — Adiciona capítulo a um livro
author.commissions        // GET — Comissões do autor
author.commissionSummary  // GET — Resumo: total, pendente, pago
```

### `subscriptions` — Assinaturas

```typescript
subscriptions.plans       // GET — Lista planos disponíveis
subscriptions.mySubscription // GET — Assinatura ativa do usuário (ou null)
subscriptions.subscribe   // POST — Cria nova assinatura
subscriptions.cancel      // POST — Cancela assinatura
```

### `purchases` — Compras Individuais

```typescript
purchases.buy             // POST — Compra um livro individual
purchases.myPurchases     // GET — Livros comprados pelo usuário
```

### `admin` — Painel Administrativo

```typescript
admin.stats               // GET — Dashboard (usuários, livros, leituras, pendentes, comissões)
admin.users               // GET — Lista usuários com paginação
admin.banUser             // POST — Bane/desban usuário
admin.promoteUser         // POST — Promove usuário a admin
admin.pendingBooks        // GET — Fila de livros pendentes de aprovação
admin.allBooks            // GET — Todos os livros com paginação
admin.approveBook         // POST — Aprova livro e publica
admin.rejectBook          // POST — Rejeita livro com justificativa
admin.setBookPrice        // POST — Define preço e nível de acesso
admin.unpublishBook       // POST — Despublica livro
admin.getBookRejection    // GET — Motivo da rejeição
admin.commissions         // GET — Comissões de todos os autores
admin.createCategory      // POST — Cria nova categoria
```

### `categories` — Categorias

```typescript
categories.list           // GET — Lista todas as categorias
categories.create         // POST — Cria nova categoria (admin)
```

---

## 🎨 Frontend — Páginas

### Landing Page (`/`)
- Hero com tagline "Transformando imaginação em histórias"
- Estatísticas (100+ livros, 50+ autores, 10k+ leituras, 5k+ avaliações)
- Seções: Mais Lidos, Melhor Avaliados, Categorias, Publicações Recentes
- Preview de planos de assinatura
- CTA para autores ("Você é escritor?")

### Catálogo (`/catalogo`)
- Busca por título/autor
- Filtros por categoria e classificação etária
- Grid responsivo de livros
- Paginação

### Página do Livro (`/livro/:slug`)
- Capa, título, autor, sinopse
- Avaliações e comentários
- Botão de leitura/compra com verificação de acesso
- Indicador de classificação etária

### Leitor Online (`/ler/:bookId/:chapterId`)
- Capítulos com navegação
- Controle de tamanho de fonte
- Modo noturno
- Progresso de leitura
- Marcadores

### Perfil (`/perfil`)
- Informações do usuário
- Favoritos
- Histórico de leitura
- Compras
- Opção de editar perfil (data de nascimento, bio, avatar)

### Painel do Autor (`/autor`)
- Resumo de comissões (total, pendente, pago)
- Lista de livros com status
- Botão para submeter novo livro
- Detalhes de cada livro (capítulos, status de aprovação)

### Planos de Assinatura (`/planos`)
- Cards de "Leitor Básico" e "Leitor Premium"
- Comparação de features
- Formas de pagamento (PIX, Mercado Pago, Stripe, PayPal) — "Em breve"
- FAQ com respostas sobre idade, diferenças de planos, comissões

### Painel Administrativo (`/admin`)
- Dashboard com stats (usuários, livros publicados, leituras, pendentes, comissões)
- Abas: Pendentes, Todos os Livros, Usuários, Comissões
- Fila de aprovação com botões Aprovar/Rejeitar + justificativa
- Gestão de preços e nível de acesso
- Gestão de usuários (banir, promover)

---

## 🧪 Testes

O projeto inclui **21 testes Vitest** cobrindo funcionalidades críticas:

```bash
pnpm test
```

### Cobertura de Testes

| Categoria | Testes |
|-----------|--------|
| **Verificação de Idade** | 7 testes (livre, 14+, 18+, sem birthDate, casos limítrofes) |
| **Cálculo de Comissão** | 5 testes (25% em múltiplos valores) |
| **Autenticação** | 3 testes (logout, me autenticado, me não autenticado) |
| **Controle de Acesso** | 2 testes (admin FORBIDDEN, UNAUTHORIZED) |
| **Nomenclatura de Planos** | 1 teste (nomes exatos) |
| **Referência de Logout** | 1 teste (cookie clearing) |
| **Total** | **21 testes** ✅ |

---

## 🚀 Como Usar

### Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start
```

### Variáveis de Ambiente

Todas as variáveis de ambiente críticas são injetadas automaticamente pelo Manus:

```env
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=secret
VITE_APP_ID=app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=owner_id
OWNER_NAME=Owner Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=key
VITE_FRONTEND_FORGE_API_KEY=key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_ANALYTICS_ENDPOINT=endpoint
VITE_ANALYTICS_WEBSITE_ID=id
```

### Fluxo de Aprovação de Livros

1. **Autor submete livro** via `/autor` (status: `pending`)
2. **Admin revisa** na fila de aprovação (`/admin` → Pendentes)
3. **Admin aprova ou rejeita**:
   - ✅ Aprova → Status `approved`, livro publicado no catálogo
   - ❌ Rejeita → Status `rejected`, justificativa salva em `book_rejections`
4. **Autor vê status** no painel do autor

### Fluxo de Compra Individual

1. Usuário acessa livro no catálogo
2. Sistema verifica idade + acesso
3. Se bloqueado por idade → mensagem de erro
4. Se bloqueado por acesso → opção de comprar ou assinar
5. Usuário clica "Comprar"
6. Comissão de 25% é calculada e registrada automaticamente

### Fluxo de Assinatura

1. Usuário acessa `/planos`
2. Escolhe "Leitor Básico" ou "Leitor Premium"
3. Clica "Assinar"
4. Seleciona método de pagamento (atualmente: manual)
5. Assinatura criada com status `active` por 1 mês
6. Usuário pode acessar livros conforme o plano

---

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| **Tabelas de Banco de Dados** | 13 |
| **Routers tRPC** | 10 (auth, books, author, subscriptions, purchases, admin, categories, + helpers) |
| **Páginas Frontend** | 8 |
| **Testes Vitest** | 21 ✅ |
| **Linhas de Código Backend** | ~500 |
| **Linhas de Código Frontend** | ~2000 |
| **Componentes React** | 40+ (shadcn/ui + custom) |
| **Categorias Pré-populadas** | 16 |

---

## 🔮 Próximos Passos

### Curto Prazo

1. **Ativar Stripe** — `webdev_add_feature stripe` para pagamentos reais
2. **Upload de Conteúdo** — Permitir autores fazer upload de capa (imagem) e conteúdo (PDF/EPUB)
3. **Notificações ao Admin** — Usar `notifyOwner` para alertas de novos livros pendentes

### Médio Prazo

4. **Integração com PIX** — Implementar webhook de confirmação
5. **Dashboard de Analytics** — Gráficos de vendas, leituras, autores top
6. **Sistema de Recomendação** — Sugerir livros baseado em histórico
7. **Comentários em Livros** — Discussão entre leitores

### Longo Prazo

8. **App Mobile** — React Native ou Flutter
9. **Leitura Social** — Compartilhar progresso, highlights, resenhas
10. **Clube do Livro** — Comunidades de leitura com discussões agendadas

---

## 📝 Notas Técnicas

### Segurança

- ✅ Autenticação via OAuth 2.0 (Manus)
- ✅ Proteção de rotas admin com middleware `adminProcedure`
- ✅ Verificação de idade em tempo real
- ✅ Validação de entrada com Zod
- ✅ Cookies seguros (httpOnly, secure, sameSite)

### Performance

- ✅ Paginação em todas as listagens
- ✅ Lazy loading de imagens
- ✅ Cache de queries tRPC
- ✅ Compressão de assets

### Acessibilidade

- ✅ Componentes shadcn/ui com ARIA
- ✅ Navegação por teclado
- ✅ Contraste de cores adequado
- ✅ Modo noturno para reduzir fadiga

---

## 📄 Licença

MIT

---

## 👨‍💻 Suporte

Para dúvidas ou problemas, consulte a documentação do tRPC, Drizzle ORM ou entre em contato com o time de desenvolvimento.

---

**Construído com ❤️ para autores e leitores independentes.**
