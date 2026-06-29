# Contos da Minha Cabeça — TODO

## Fase 1: Banco de Dados & Schema
- [x] Estender tabela `users` com campos: birthDate, bio, avatarUrl, displayName
- [x] Criar tabela `categories` (id, name, slug, createdAt)
- [x] Criar tabela `books` (id, title, subtitle, authorId, categoryId, synopsis, coverUrl, contentUrl, contentRating, status, price, tags, views, createdAt, updatedAt)
- [x] Criar tabela `chapters` (id, bookId, title, order, content, createdAt)
- [x] Criar tabela `subscription_plans` (id, name, slug, description, monthlyPrice, features)
- [x] Criar tabela `subscriptions` (id, userId, planId, status, startDate, endDate, paymentMethod, createdAt)
- [x] Criar tabela `book_purchases` (id, userId, bookId, price, paymentMethod, paymentStatus, createdAt)
- [x] Criar tabela `author_commissions` (id, authorId, bookId, sourceType, sourceId, amount, status, createdAt)
- [x] Criar tabela `payment_intents` (id, userId, type, amount, method, status, metadata, createdAt)
- [x] Criar tabela `book_ratings` (id, userId, bookId, rating, comment, createdAt)
- [x] Criar tabela `book_favorites` (id, userId, bookId, createdAt)
- [x] Criar tabela `reading_history` (id, userId, bookId, chapterId, progress, lastReadAt)
- [x] Criar tabela `book_rejections` (id, bookId, adminId, reason, createdAt)
- [x] Executar migração SQL no banco
- [x] Popular planos "Leitor Básico" e "Leitor Premium" e 16 categorias

## Fase 2: Backend (tRPC Routers)
- [x] Router `auth` — me, logout, updateProfile (com birthDate)
- [x] Router `books` — list, getById, getBySlug, search, featured, topRated, recent
- [x] Router `books.author` — submit, listMine, addChapter
- [x] Router `books.admin` — listPending, approve, reject, setPrice, listAll, unpublish
- [x] Router `categories` — list, create (admin)
- [x] Router `subscriptions` — getPlans, subscribe, getMySubscription (retorna null), cancel
- [x] Router `purchases` — buyBook, getMyPurchases, checkAccess
- [x] Router `commissions` — listByAuthor, listAll (admin), summary
- [x] Router `ratings` — rate, listByBook
- [x] Router `favorites` — toggle, listMine
- [x] Router `reading` — saveProgress, getProgress, getHistory
- [x] Router `admin.users` — list, ban, unban, promoteToAdmin
- [x] Router `admin.stats` — dashboard summary
- [x] Middleware `adminProcedure` para proteção de rotas admin
- [x] Helper `canAccessContent` — verificação de faixa etária (livre/14+/18+)
- [x] Helper `checkBookAccess` — controle de acesso completo (idade + plano + compra)
- [x] Comissão automática de 25% calculada em `createBookPurchase`

## Fase 3: Frontend — Público & Autor
- [x] Configurar tema visual elegante (cores, tipografia, CSS variables)
- [x] Configurar fontes Google (Playfair Display + Inter)
- [x] Landing page com hero, destaques, categorias populares e CTA
- [x] Catálogo público com busca e filtros por categoria/rating
- [x] Página individual do livro (capa, sinopse, avaliações, botão de leitura/compra)
- [x] Leitor online (capítulos, controle de fonte, modo noturno, progresso)
- [x] Perfil do usuário (foto, bio, histórico, favoritos, compras)
- [x] Painel do autor (submissão de livros, listagem, status de aprovação, comissões)
- [x] Página de planos de assinatura (Leitor Básico e Leitor Premium)
- [x] Verificação de idade em tempo real ao acessar conteúdo restrito
- [x] Formas de pagamento preparadas (PIX, Mercado Pago, Stripe, PayPal) — "Em breve"
- [x] Navbar responsiva com dropdown de usuário, links de admin/autor

## Fase 4: Frontend — Painel Administrativo
- [x] Dashboard admin (stats: usuários, livros, leituras, pendentes, comissões)
- [x] Fila de aprovação de livros (pendentes, com botões aprovar/rejeitar + justificativa)
- [x] Gestão de livros publicados (editar preço, nível de acesso, despublicar)
- [x] Gestão de usuários (listar, banir, promover a admin)
- [x] Relatório de comissões por autor
- [x] Acesso restrito a administradores com mensagem de erro elegante

## Fase 5: Qualidade & Entrega
- [x] 21 testes Vitest passando (verificação de idade, comissão 25%, auth, admin, planos)
- [x] Corrigir `mySubscription` para retornar `null` em vez de `undefined`
- [x] Corrigir import duplicado de `useState` no AdminPanel
- [x] Checkpoint final e entrega

## Fase 6: Sistema de Análise por IA (Moderação)
- [x] Criar router `admin.analyzeBook` com integração de LLM
- [x] Implementar análise de sinopse + capítulos com prompt estruturado
- [x] Gerar relatório com: resumo, validação de classificação etária, erros gramaticais
- [x] Criar componente de card elegante para exibir análise no AdminPanel
- [x] Adicionar botão "Análise de Moderação por IA" na fila de aprovação
- [x] Testes para análise de IA (21 testes passando)
- [x] Checkpoint final com análise de IA

## Fase 7: Comissionamento, Rastreamento e Monetização Avançada
- [x] Criar tabela `reading_progress` com deduplicação de leitura
- [x] Criar tabela `author_earnings` com split 50/50 assinatura/pool
- [x] Criar tabela `subscription_payments` para rastreamento de pagamentos
- [x] Implementar helper `recordReadingProgress` com deduplicação
- [x] Implementar helper `calculateAuthorEarnings` (50% assinatura / 50% pool)
- [x] Criar router `author.myEarnings` para dashboard do autor
- [x] Criar router `subscription.createPayment` para PIX/Mercado Pago
- [x] Criar router `admin.rejectBookWithFeedback` com motivo + feedback IA
- [x] Adicionar modal de rejeição com textarea para motivo
- [x] Integrar feedback da IA no modal (pré-preenchido)
- [x] Implementar upload de capa com preview
- [x] Implementar upload de arquivo (PDF/EPUB) com barra de progresso
- [x] Criar página `/plans` com cards dos planos
- [x] Adicionar botões de checkout com integração PIX/Mercado Pago
- [x] Implementar fluxo de pagamento PIX (QR Code)
- [x] Testes para deduplicação de leitura (46 testes passando)
- [x] Checkpoint final com todas as funcionalidades

## Fase 8: Pagamento PIX Real via Mercado Pago + Sistema de Anúncios
- [x] Adicionar secrets: MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_USER_ID
- [x] Atualizar planos: Gratuito (sem preço), Acesso (R$4,99), Premium (R$14,99)
- [x] Implementar router `admin.createPixOrder` com integração Mercado Pago
- [x] Gerar QR Code PIX e retornar URL + copy-paste
- [x] Criar modal com QR Code PIX (imagem + copy-paste)
- [x] Adicionar componente `<AdBanner>` reutilizável
- [x] Mostrar anúncios em Catálogo, Livro, Leitor (se plano com showAds=true)
- [x] Ocultar anúncios para Premium
- [x] Testes para checkout PIX (47 testes passando)
- [x] Checkpoint final

## Próximos Passos (Fase 9)
- [ ] Implementar webhook `/api/webhooks/mercadopago` para confirmar pagamento
- [ ] Ativar assinatura apenas após confirmação do webhook
- [ ] Exibir status de pagamento em tempo real
- [ ] Redirecionar para dashboard após confirmação
- [ ] Testes para webhook Mercado Pago
- [ ] Integração com Stripe (alternativa)
- [ ] Integração com PayPal (alternativa)
