import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  authorReaders,
  bookFavorites,
  bookRatings,
  bookRejections,
  books,
  categories,
  chapters,
  donations,
  donorBadges,
  InsertUser,
  readingHistory,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  data: { displayName?: string; bio?: string; avatarUrl?: string; birthDate?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function listUsers(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const items = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return { items, total: Number(count) };
}

export async function setUserBanned(userId: number, isBanned: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBanned }).where(eq(users.id, userId));
}

export async function setUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(name: string, slug: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(categories).values({ name, slug, description });
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function listApprovedBooks(opts: {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
  contentRating?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { page = 1, limit = 20, categoryId, search, contentRating } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(books.status, "approved")];
  if (categoryId) conditions.push(eq(books.categoryId, categoryId));
  if (contentRating) conditions.push(eq(books.contentRating, contentRating as "livre" | "14+" | "18+"));
  if (search) {
    conditions.push(
      or(like(books.title, `%${search}%`), like(books.synopsis, `%${search}%`)) as ReturnType<typeof eq>
    );
  }

  const items = await db
    .select({
      id: books.id,
      title: books.title,
      subtitle: books.subtitle,
      slug: books.slug,
      authorId: books.authorId,
      categoryId: books.categoryId,
      synopsis: books.synopsis,
      coverUrl: books.coverUrl,
      contentRating: books.contentRating,
      price: books.price,
      views: books.views,
      likes: books.likes,
      avgRating: books.avgRating,
      ratingCount: books.ratingCount,
      accessLevel: books.accessLevel,
      tags: books.tags,
      createdAt: books.createdAt,
    })
    .from(books)
    .where(and(...conditions))
    .orderBy(desc(books.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(books)
    .where(and(...conditions));

  return { items, total: Number(count) };
}

export async function getBookBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(books).where(eq(books.slug, slug)).limit(1);
  return result[0];
}

export async function getBookById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return result[0];
}

export async function getFeaturedBooks(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(books)
    .where(eq(books.status, "approved"))
    .orderBy(desc(books.views))
    .limit(limit);
}

export async function getTopRatedBooks(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(books)
    .where(and(eq(books.status, "approved"), sql`${books.ratingCount} > 0`))
    .orderBy(desc(books.avgRating))
    .limit(limit);
}

export async function getRecentBooks(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(books)
    .where(eq(books.status, "approved"))
    .orderBy(desc(books.createdAt))
    .limit(limit);
}

export async function getBooksByAuthor(authorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(books).where(eq(books.authorId, authorId)).orderBy(desc(books.createdAt));
}

export async function createBook(data: {
  title: string;
  subtitle?: string;
  slug: string;
  authorId: number;
  categoryId?: number;
  synopsis?: string;
  coverUrl?: string;
  contentUrl?: string;
  contentRating: "livre" | "14+" | "18+";
  tags?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(books).values({ ...data, status: "pending" });
  const result = await db.select().from(books).where(eq(books.slug, data.slug)).limit(1);
  return result[0];
}

export async function updateBookStatus(
  bookId: number,
  status: "approved" | "rejected" | "unpublished" | "pending"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(books).set({ status }).where(eq(books.id, bookId));
}

export async function setBookPrice(bookId: number, price: number | null, accessLevel: "free" | "basic" | "premium") {
  const db = await getDb();
  if (!db) return;
  await db.update(books).set({ price: price?.toString(), accessLevel }).where(eq(books.id, bookId));
}

export async function incrementBookViews(bookId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(books).set({ views: sql`${books.views} + 1` }).where(eq(books.id, bookId));
}

export async function listPendingBooks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(books).where(eq(books.status, "pending")).orderBy(books.createdAt);
}

export async function listAllBooksAdmin(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const items = await db.select().from(books).orderBy(desc(books.createdAt)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(books);
  return { items, total: Number(count) };
}

export async function createBookRejection(bookId: number, adminId: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bookRejections).values({ bookId, adminId, reason });
}

export async function getBookRejection(bookId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bookRejections)
    .where(eq(bookRejections.bookId, bookId))
    .orderBy(desc(bookRejections.createdAt))
    .limit(1);
  return result[0];
}

// ─── Chapters ─────────────────────────────────────────────────────────────────

export async function getChaptersByBook(bookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(chapters.orderIndex);
}

export async function getChapterById(chapterId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  return result[0];
}

export async function createChapter(data: {
  bookId: number;
  title?: string;
  orderIndex: number;
  content?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chapters).values(data);
}

// ─── Donations ────────────────────────────────────────────────────────────────

export async function createDonation(data: {
  userId: number;
  amount: number;
  month: string;
  transactionId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(donations).values({
    userId: data.userId,
    amount: data.amount.toString(),
    month: data.month,
    transactionId: data.transactionId,
    status: "pending",
  });
}

export async function getDonationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(donations)
    .where(eq(donations.userId, userId))
    .orderBy(desc(donations.createdAt));
}

export async function getUserTotalDonations(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, currentMonth: 0 };
  const userDonations = await db
    .select()
    .from(donations)
    .where(and(eq(donations.userId, userId), eq(donations.status, "paid")));
  const total = userDonations.reduce((s, d) => s + parseFloat(d.amount), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthDonations = userDonations
    .filter((d) => d.month === currentMonth)
    .reduce((s, d) => s + parseFloat(d.amount), 0);
  return { total, currentMonth: currentMonthDonations };
}

export async function getMonthlyDonationStats(month: string) {
  const db = await getDb();
  if (!db) return [];
  const paidDonations = await db
    .select()
    .from(donations)
    .where(and(eq(donations.month, month), eq(donations.status, "paid")));
  const grouped = new Map<number, { userId: number; totalAmount: number }>();
  for (const d of paidDonations) {
    const existing = grouped.get(d.userId);
    if (existing) {
      existing.totalAmount += parseFloat(d.amount);
    } else {
      grouped.set(d.userId, { userId: d.userId, totalAmount: parseFloat(d.amount) });
    }
  }
  return Array.from(grouped.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export async function updateDonationStatus(paymentId: string, status: "pending" | "paid" | "failed") {
  const db = await getDb();
  if (!db) return;
  await db
    .update(donations)
    .set({ status, transactionId: paymentId })
    .where(eq(donations.transactionId, paymentId));
}

// ─── Donor Badges ──────────────────────────────────────────────────────────────

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(donorBadges)
    .where(eq(donorBadges.userId, userId))
    .orderBy(desc(donorBadges.month));
}

export async function getCurrentMonthBadges() {
  const db = await getDb();
  if (!db) return [];
  const currentMonth = new Date().toISOString().slice(0, 7);
  return db
    .select()
    .from(donorBadges)
    .where(eq(donorBadges.month, currentMonth))
    .orderBy(donorBadges.position);
}

export async function awardMonthlyBadges() {
  const db = await getDb();
  if (!db) return;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const ranking = await getMonthlyDonationStats(currentMonth);
  const badgeTypes = ["gold", "silver", "bronze"] as const;
  for (let i = 0; i < Math.min(3, ranking.length); i++) {
    const alreadyAwarded = await db
      .select()
      .from(donorBadges)
      .where(and(eq(donorBadges.userId, ranking[i].userId), eq(donorBadges.month, currentMonth)))
      .limit(1);
    if (alreadyAwarded.length === 0) {
      await db.insert(donorBadges).values({
        userId: ranking[i].userId,
        badgeType: badgeTypes[i],
        month: currentMonth,
        position: i + 1,
      });
    }
  }
}

// ─── Author Readers (unique readers for revenue split) ─────────────────────────

export async function recordAuthorReader(authorId: number, userId: number, month: string) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(authorReaders)
    .where(and(eq(authorReaders.authorId, authorId), eq(authorReaders.userId, userId), eq(authorReaders.month, month)))
    .limit(1);
  if (existing.length > 0) return false;
  await db.insert(authorReaders).values({ authorId, userId, month });
  return true;
}

export async function getAuthorReaderCount(authorId: number, month: string) {
  const db = await getDb();
  if (!db) return 0;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(authorReaders)
    .where(and(eq(authorReaders.authorId, authorId), eq(authorReaders.month, month)));
  return Number(count);
}

export async function getTotalUniqueReaders(month: string) {
  const db = await getDb();
  if (!db) return 0;
  const readers = await db
    .select()
    .from(authorReaders)
    .where(eq(authorReaders.month, month));
  return new Set(readers.map((r) => r.userId)).size;
}

export async function getAuthorDonationShare(authorId: number, month: string) {
  const db = await getDb();
  if (!db) return 0;
  const allDonations = await db
    .select()
    .from(donations)
    .where(and(eq(donations.month, month), eq(donations.status, "paid")));
  const totalPaid = allDonations.reduce((s, d) => s + parseFloat(d.amount), 0);
  if (totalPaid === 0) return 0;
  const authorReaderRows = await db
    .select()
    .from(authorReaders)
    .where(and(eq(authorReaders.authorId, authorId), eq(authorReaders.month, month)));
  const authorUniqueCount = new Set(authorReaderRows.map((r) => r.userId)).size;
  const totalUniqueReaders = await getTotalUniqueReaders(month);
  if (totalUniqueReaders === 0) return 0;
  const authorPool = totalPaid * 0.5;
  return (authorUniqueCount / totalUniqueReaders) * authorPool;
}

// ─── Ratings ──────────────────────────────────────────────────────────────────

export async function getRatingsByBook(bookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookRatings)
    .where(eq(bookRatings.bookId, bookId))
    .orderBy(desc(bookRatings.createdAt));
}

export async function getUserRating(userId: number, bookId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bookRatings)
    .where(and(eq(bookRatings.userId, userId), eq(bookRatings.bookId, bookId)))
    .limit(1);
  return result[0];
}

export async function upsertRating(userId: number, bookId: number, rating: number, comment?: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserRating(userId, bookId);
  if (existing) {
    await db
      .update(bookRatings)
      .set({ rating, comment })
      .where(and(eq(bookRatings.userId, userId), eq(bookRatings.bookId, bookId)));
  } else {
    await db.insert(bookRatings).values({ userId, bookId, rating, comment });
  }
  // Recalculate average
  const ratings = await getRatingsByBook(bookId);
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  await db
    .update(books)
    .set({ avgRating: avg.toFixed(2), ratingCount: ratings.length })
    .where(eq(books.id, bookId));
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookFavorites).where(eq(bookFavorites.userId, userId));
}

export async function toggleFavorite(userId: number, bookId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(bookFavorites)
    .where(and(eq(bookFavorites.userId, userId), eq(bookFavorites.bookId, bookId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(bookFavorites)
      .where(and(eq(bookFavorites.userId, userId), eq(bookFavorites.bookId, bookId)));
    return false;
  } else {
    await db.insert(bookFavorites).values({ userId, bookId });
    return true;
  }
}

// ─── Reading History ──────────────────────────────────────────────────────────

export async function saveReadingProgress(
  userId: number,
  bookId: number,
  chapterId: number,
  progress: number
) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(readingHistory)
    .where(and(eq(readingHistory.userId, userId), eq(readingHistory.bookId, bookId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(readingHistory)
      .set({ chapterId, progress, lastReadAt: new Date() })
      .where(and(eq(readingHistory.userId, userId), eq(readingHistory.bookId, bookId)));
  } else {
    await db.insert(readingHistory).values({ userId, bookId, chapterId, progress });
  }
}

export async function getReadingProgress(userId: number, bookId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(readingHistory)
    .where(and(eq(readingHistory.userId, userId), eq(readingHistory.bookId, bookId)))
    .limit(1);
  return result[0];
}

export async function getUserReadingHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.lastReadAt))
    .limit(20);
}

// ─── Platform Stats ────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalBooks: 0, totalAuthors: 0, totalReads: 0, totalRatings: 0 };

  const [{ totalBooks }] = await db
    .select({ totalBooks: sql<number>`count(*)` })
    .from(books)
    .where(eq(books.status, "approved"));
  const [{ totalAuthors }] = await db
    .select({ totalAuthors: sql<number>`count(distinct ${books.authorId})` })
    .from(books)
    .where(eq(books.status, "approved"));
  const [{ totalReads }] = await db
    .select({ totalReads: sql<number>`count(*)` })
    .from(readingHistory);
  const [{ totalRatings }] = await db
    .select({ totalRatings: sql<number>`count(*)` })
    .from(bookRatings);

  return {
    totalBooks: Number(totalBooks),
    totalAuthors: Number(totalAuthors),
    totalReads: Number(totalReads),
    totalRatings: Number(totalRatings),
  };
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalBooks: 0, totalViews: 0, pendingBooks: 0, totalCommissions: 0 };

  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(users);
  const [{ totalBooks }] = await db
    .select({ totalBooks: sql<number>`count(*)` })
    .from(books)
    .where(eq(books.status, "approved"));
  const [{ totalViews }] = await db
    .select({ totalViews: sql<number>`sum(${books.views})` })
    .from(books);
  const [{ pendingBooks }] = await db
    .select({ pendingBooks: sql<number>`count(*)` })
    .from(books)
    .where(eq(books.status, "pending"));
  const [{ totalDonations }] = await db
    .select({ totalDonations: sql<number>`sum(${donations.amount})` })
    .from(donations)
    .where(eq(donations.status, "paid"));

  return {
    totalUsers: Number(totalUsers),
    totalBooks: Number(totalBooks),
    totalViews: Number(totalViews) || 0,
    pendingBooks: Number(pendingBooks),
    totalDonations: Number(totalDonations) || 0,
  };
}
