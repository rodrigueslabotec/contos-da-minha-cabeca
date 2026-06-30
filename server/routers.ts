import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import {
  awardMonthlyBadges,
  createBook,
  createBookRejection,
  createCategory,
  createChapter,
  createDonation,
  getAdminStats,
  getPlatformStats,
  getAuthorDonationShare,
  getAuthorReaderCount,
  getBookById,
  getBookBySlug,
  getBooksByAuthor,
  getChapterById,
  getChaptersByBook,
  getCurrentMonthBadges,
  getDonationsByUser,
  getMonthlyDonationStats,
  getFeaturedBooks,
  getRatingsByBook,
  getRecentBooks,
  getTopRatedBooks,
  getUserBadges,
  getUserFavorites,
  getUserReadingHistory,
  getUserTotalDonations,
  getReadingProgress,
  incrementBookViews,
  listAllBooksAdmin,
  listApprovedBooks,
  listCategories,
  listPendingBooks,
  listUsers,
  recordAuthorReader,
  saveReadingProgress,
  setUserBanned,
  setUserRole,
  toggleFavorite,
  updateBookStatus,
  updateUserProfile,
  upsertRating,
  upsertUser,
  getUserByOpenId,
  getBookRejection,
} from "./db";
import { storagePut } from "./storage";

// ─── Age Verification Helper ──────────────────────────────────────────────────
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function canAccessContent(
  userBirthDate: string | null | undefined,
  contentRating: string
): { allowed: boolean; reason?: string } {
  if (contentRating === "livre") return { allowed: true };
  if (!userBirthDate) {
    return { allowed: false, reason: "Você precisa informar sua data de nascimento para acessar este conteúdo." };
  }
  const age = calculateAge(userBirthDate);
  if (contentRating === "18+" && age < 18) {
    return { allowed: false, reason: "Este conteúdo é restrito para maiores de 18 anos." };
  }
  if (contentRating === "14+" && age < 14) {
    return { allowed: false, reason: "Este conteúdo é restrito para maiores de 14 anos." };
  }
  return { allowed: true };
}

// ─── Access Level Helper ──────────────────────────────────────────────────────
async function checkBookAccess(
  userId: number,
  bookId: number,
  book: { contentRating: string },
  userBirthDate: string | null | undefined,
  chapterId?: number
): Promise<{ allowed: boolean; reason?: string }> {
  // All books are free — only age check applies
  const ageCheck = canAccessContent(userBirthDate, book.contentRating);
  if (!ageCheck.allowed) return ageCheck;
  return { allowed: true };
}

// ─── Slug Generator ───────────────────────────────────────────────────────────
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") +
    "-" +
    Date.now().toString(36)
  );
}

// ─── Admin Middleware ─────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    status: publicProcedure.query(() => ({
      bypassEnabled: ENV.authBypass,
    })),
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    devLogin: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(128),
          email: z.string().email().optional(),
          password: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ENV.authBypass) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Auth bypass not enabled" });
        }
        if (ENV.authBypassPassword && input.password !== ENV.authBypassPassword) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid password" });
        }
        const { eq } = await import("drizzle-orm");
        const { users } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const db = await getDb();
        let existingUser: typeof users.$inferSelect | undefined;
        if (input.email && db) {
          [existingUser] = await db.select().from(users).where(eq(users.email, input.email));
        }
        if (existingUser) {
          await db!.update(users).set({ name: input.name, lastSignedIn: new Date() }).where(eq(users.id, existingUser.id));
        }
        const openId = existingUser?.openId ?? `bypass_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        if (!existingUser) {
          await upsertUser({
            openId,
            name: input.name,
            email: input.email ?? null,
            loginMethod: "bypass",
            lastSignedIn: new Date(),
          });
        }
        const user = existingUser ? await getUserByOpenId(existingUser.openId) : await getUserByOpenId(openId);
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user };
      }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          displayName: z.string().min(2).max(128).optional(),
          bio: z.string().max(500).optional(),
          avatarUrl: z.string().url().optional(),
          birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => listCategories()),
    create: adminProcedure
      .input(z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await createCategory(input.name, input.slug, input.description);
        return { success: true };
      }),
  }),

  // ── Platform Stats ───────────────────────────────────────────────────────
  platform: router({
    stats: publicProcedure.query(() => getPlatformStats()),
  }),

  // ── Books (Public) ────────────────────────────────────────────────────────
  books: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
          categoryId: z.number().optional(),
          search: z.string().optional(),
          contentRating: z.string().optional(),
        })
      )
      .query(({ input }) => listApprovedBooks(input)),

    featured: publicProcedure.query(() => getFeaturedBooks()),
    topRated: publicProcedure.query(() => getTopRatedBooks()),
    recent: publicProcedure.query(() => getRecentBooks()),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const book = await getBookBySlug(input.slug);
        if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "Livro não encontrado." });
        return book;
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const book = await getBookById(input.id);
        if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "Livro não encontrado." });
        return book;
      }),

    ratings: publicProcedure
      .input(z.object({ bookId: z.number() }))
      .query(({ input }) => getRatingsByBook(input.bookId)),

    chapters: publicProcedure
      .input(z.object({ bookId: z.number() }))
      .query(({ input }) => getChaptersByBook(input.bookId)),

    // Check if user can access a book (all books free, only age check)
    checkAccess: protectedProcedure
      .input(z.object({ bookId: z.number(), chapterId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId);
        if (!book) throw new TRPCError({ code: "NOT_FOUND" });
        return checkBookAccess(ctx.user.id, input.bookId, book, ctx.user.birthDate, input.chapterId);
      }),

    // Read a chapter (access-controlled)
    readChapter: protectedProcedure
      .input(z.object({ chapterId: z.number() }))
      .query(async ({ ctx, input }) => {
        const chapter = await getChapterById(input.chapterId);
        if (!chapter) throw new TRPCError({ code: "NOT_FOUND" });
        const book = await getBookById(chapter.bookId);
        if (!book) throw new TRPCError({ code: "NOT_FOUND" });

        const access = await checkBookAccess(ctx.user.id, book.id, book, ctx.user.birthDate, input.chapterId);
        if (!access.allowed) {
          throw new TRPCError({ code: "FORBIDDEN", message: access.reason });
        }
        await incrementBookViews(book.id);
        return chapter;
      }),

    // Record a unique reader for author revenue split
    recordRead: protectedProcedure
      .input(z.object({ authorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const month = new Date().toISOString().slice(0, 7);
        const isNew = await recordAuthorReader(input.authorId, ctx.user.id, month);
        return { isNew };
      }),

    rate: protectedProcedure
      .input(z.object({ bookId: z.number(), rating: z.number().min(1).max(5), comment: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await upsertRating(ctx.user.id, input.bookId, input.rating, input.comment);
        return { success: true };
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isFavorited = await toggleFavorite(ctx.user.id, input.bookId);
        return { isFavorited };
      }),

    myFavorites: protectedProcedure.query(async ({ ctx }) => {
      const favs = await getUserFavorites(ctx.user.id);
      return favs;
    }),

    saveProgress: protectedProcedure
      .input(z.object({ bookId: z.number(), chapterId: z.number(), progress: z.number().min(0).max(100) }))
      .mutation(async ({ ctx, input }) => {
        await saveReadingProgress(ctx.user.id, input.bookId, input.chapterId, input.progress);
        return { success: true };
      }),

    readingHistory: protectedProcedure.query(async ({ ctx }) => getUserReadingHistory(ctx.user.id)),

    readingProgress: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => getReadingProgress(ctx.user.id, input.bookId)),
  }),

  // ── Author Panel ──────────────────────────────────────────────────────────
  author: router({
    myBooks: protectedProcedure.query(async ({ ctx }) => getBooksByAuthor(ctx.user.id)),

    submit: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          subtitle: z.string().max(255).optional(),
          categoryId: z.number().optional(),
          synopsis: z.string().max(2000).optional(),
          coverUrl: z.string().optional(),
          contentUrl: z.string().optional(),
          contentRating: z.enum(["livre", "14+", "18+"]),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const slug = generateSlug(input.title);
        const book = await createBook({ ...input, slug, authorId: ctx.user.id });
        return { success: true, book };
      }),

    addChapter: protectedProcedure
      .input(
        z.object({
          bookId: z.number(),
          title: z.string().optional(),
          orderIndex: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId);
        if (!book || book.authorId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para editar este livro." });
        }
        await createChapter(input);
        return { success: true };
      }),

    donationShare: protectedProcedure.query(async ({ ctx }) => {
      const month = new Date().toISOString().slice(0, 7);
      return getAuthorDonationShare(ctx.user.id, month);
    }),
    readerCount: protectedProcedure.query(async ({ ctx }) => {
      const month = new Date().toISOString().slice(0, 7);
      return getAuthorReaderCount(ctx.user.id, month);
    }),
  }),

  // ── Donations ────────────────────────────────────────────────────────────
  donations: router({
    // Create a PIX donation intent
    createPix: protectedProcedure
      .input(z.object({ amount: z.number().min(1).max(50000) }))
      .mutation(async ({ ctx, input }) => {
        const month = new Date().toISOString().slice(0, 7);
        await createDonation({
          userId: ctx.user.id,
          amount: input.amount,
          month,
        });

        // Create MP payment
        const { createPixDonation } = await import("./mercadopago");
        const result = await createPixDonation(input.amount, ctx.user.email || "", 0);
        return {
          success: true,
          paymentId: result.paymentId,
          qrCode: result.qrCode,
          qrCodeUrl: result.qrCodeUrl,
          copyPaste: result.copyPaste,
          amount: input.amount,
        };
      }),

    myDonations: protectedProcedure.query(async ({ ctx }) => getDonationsByUser(ctx.user.id)),
    myTotal: protectedProcedure.query(async ({ ctx }) => getUserTotalDonations(ctx.user.id)),

    // Donor ranking (current month)
    ranking: protectedProcedure.query(async () => {
      const month = new Date().toISOString().slice(0, 7);
      const stats = await getMonthlyDonationStats(month);
      const top3 = stats.slice(0, 3).map((s, i) => ({
        position: i + 1,
        userId: s.userId,
      }));
      return { month, ranking: top3 };
    }),

    // Current month badges
    badges: publicProcedure.query(() => getCurrentMonthBadges()),

    // User badges (all-time)
    myBadges: protectedProcedure.query(async ({ ctx }) => getUserBadges(ctx.user.id)),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getAdminStats()),

    // Users
    users: adminProcedure
      .input(z.object({ page: z.number().min(1).default(1) }))
      .query(({ input }) => listUsers(input.page)),

    banUser: adminProcedure
      .input(z.object({ userId: z.number(), isBanned: z.boolean() }))
      .mutation(async ({ input }) => {
        await setUserBanned(input.userId, input.isBanned);
        return { success: true };
      }),

    promoteUser: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await setUserRole(input.userId, input.role);
        return { success: true };
      }),

    // Books approval queue
    pendingBooks: adminProcedure.query(() => listPendingBooks()),

    allBooks: adminProcedure
      .input(z.object({ page: z.number().min(1).default(1) }))
      .query(({ input }) => listAllBooksAdmin(input.page)),

    approveBook: adminProcedure
      .input(z.object({ bookId: z.number() }))
      .mutation(async ({ input }) => {
        await updateBookStatus(input.bookId, "approved");
        return { success: true };
      }),

    rejectBook: adminProcedure
      .input(z.object({ bookId: z.number(), reason: z.string().min(10) }))
      .mutation(async ({ ctx, input }) => {
        await updateBookStatus(input.bookId, "rejected");
        await createBookRejection(input.bookId, ctx.user.id, input.reason);
        return { success: true };
      }),

    unpublishBook: adminProcedure
      .input(z.object({ bookId: z.number() }))
      .mutation(async ({ input }) => {
        await updateBookStatus(input.bookId, "unpublished");
        return { success: true };
      }),

    getBookRejection: adminProcedure
      .input(z.object({ bookId: z.number() }))
      .query(({ input }) => getBookRejection(input.bookId)),

    // Categories
    createCategory: adminProcedure
      .input(z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await createCategory(input.name, input.slug, input.description);
        return { success: true };
      }),

    updateCategory: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().min(2), slug: z.string().min(2), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("DB not available");
        const { categories } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(categories).set({ name: input.name, slug: input.slug, description: input.description ?? "" }).where(eq(categories.id, input.id));
        return { success: true };
      }),

    // Manually award monthly badges
    awardBadges: adminProcedure.mutation(async () => {
      await awardMonthlyBadges();
      return { success: true };
    }),

    // AI-powered moderation analysis
    analyzeBook: adminProcedure
      .input(z.object({ bookId: z.number() }))
      .mutation(async ({ input }) => {
        const book = await getBookById(input.bookId);
        if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "Livro não encontrado" });

        const chapters = await getChaptersByBook(input.bookId);
        const chaptersText = chapters.map((ch) => `## ${ch.title}\n${ch.content}`).join("\n\n");

        const prompt = `Você é um moderador editorial especializado em validar conteúdo para uma plataforma de publicação de livros.

Analise o livro a seguir e gere um relatório estruturado em JSON com as seguintes informações:

1. **Resumo do Conteúdo**: Um resumo breve (2-3 linhas) do que o livro trata
2. **Classificação Etária Validada**: Confirme se a classificação atual (${book.contentRating}) é apropriada. Respostas: "Adequada", "Muito Restritiva", "Muito Permissiva"
3. **Motivo da Classificação**: Explique brevemente por que essa classificação é apropriada
4. **Erros Gramaticais**: Liste os principais erros de gramática, pontuação ou ortografia encontrados (máximo 10)
5. **Qualidade Geral**: Avalie a qualidade editorial em uma escala de 1-10
6. **Recomendações**: Sugestões breves para melhorias

Retorne APENAS um objeto JSON válido, sem markdown ou explicações adicionais.

**LIVRO:**

**Título:** ${book.title}
**Sinopse:** ${book.synopsis}
**Classificação Atual:** ${book.contentRating}

**Conteúdo:**
${chaptersText}

Retorne o JSON no seguinte formato:
{
  "resumo": "...",
  "classificacaoValidada": "Adequada|Muito Restritiva|Muito Permissiva",
  "motivoClassificacao": "...",
  "errosGramaticais": ["erro 1", "erro 2", ...],
  "qualidadeGeral": 8,
  "recomendacoes": ["recomendação 1", "recomendação 2", ...]
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao processar análise" });

        const contentStr = typeof content === "string" ? content : content[0]?.type === "text" ? content[0].text : "";
        if (!contentStr) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Resposta da IA vazia" });

        const cleanJson = contentStr.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();

        try {
          const analysis = JSON.parse(cleanJson);
          return {
            bookId: input.bookId,
            bookTitle: book.title,
            analysis,
            analyzedAt: new Date(),
          };
        } catch (e) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Resposta da IA inválida" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
