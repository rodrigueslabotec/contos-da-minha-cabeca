import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  displayName: varchar("displayName", { length: 128 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  birthDate: varchar("birthDate", { length: 10 }), // YYYY-MM-DD
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── Books ────────────────────────────────────────────────────────────────────
export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  authorId: int("authorId").notNull(),
  categoryId: int("categoryId"),
  synopsis: text("synopsis"),
  coverUrl: text("coverUrl"),
  contentUrl: text("contentUrl"), // S3 key for uploaded file
  contentRating: mysqlEnum("contentRating", ["livre", "14+", "18+"]).default("livre").notNull(),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "unpublished"]).default("draft").notNull(),
  // Price set exclusively by admin (null = not for individual sale)
  price: decimal("price", { precision: 10, scale: 2 }),
  tags: text("tags"), // JSON array stored as text
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: int("ratingCount").default(0).notNull(),
  // Access control: free=anyone, basic=Leitor Básico+, premium=Leitor Premium only
  accessLevel: mysqlEnum("accessLevel", ["free", "basic", "premium"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

// ─── Book Rejections ──────────────────────────────────────────────────────────
export const bookRejections = mysqlTable("book_rejections", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  adminId: int("adminId").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Chapters ─────────────────────────────────────────────────────────────────
export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  title: varchar("title", { length: 255 }),
  orderIndex: int("orderIndex").default(0).notNull(),
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;

// ─── Donations ────────────────────────────────────────────────────────────────
export const donations = mysqlTable("donations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "mercadopago"]).default("pix"),
  transactionId: varchar("transactionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Donation = typeof donations.$inferSelect;

// ─── Donor Badges (Top 3 monthly) ─────────────────────────────────────────────
export const donorBadges = mysqlTable("donor_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeType: mysqlEnum("badgeType", ["gold", "silver", "bronze"]).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  position: int("position").notNull(), // 1, 2, or 3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DonorBadge = typeof donorBadges.$inferSelect;

// ─── Author Readers (unique readers for revenue split) ─────────────────────────
export const authorReaders = mysqlTable("author_readers", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthorReader = typeof authorReaders.$inferSelect;

// ─── Book Ratings ─────────────────────────────────────────────────────────────
export const bookRatings = mysqlTable("book_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Book Favorites ───────────────────────────────────────────────────────────
export const bookFavorites = mysqlTable("book_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Reading History ──────────────────────────────────────────────────────────
export const readingHistory = mysqlTable("reading_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  chapterId: int("chapterId"),
  progress: int("progress").default(0), // 0-100 percentage
  lastReadAt: timestamp("lastReadAt").defaultNow().notNull(),
});


// ─── Reading Progress (Monetization Tracking) ─────────────────────────────────
// Tracks unique page/chapter reads per user for commission calculation
// Key rule: Each user-chapter combination is recorded ONCE for monetization
export const readingProgress = mysqlTable("reading_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  chapterId: int("chapterId").notNull(),
  pageNumber: int("pageNumber").default(1),
  isMonetized: boolean("isMonetized").default(false).notNull(),
  monetizationMethod: mysqlEnum("monetizationMethod", ["subscription", "purchase", "free"]).default("free"),
  subscriptionId: int("subscriptionId"),
  purchaseId: int("purchaseId"),
  readAt: timestamp("readAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReadingProgress = typeof readingProgress.$inferSelect;

// ─── Author Earnings (Aggregated Commission Data) ──────────────────────────────
export const authorEarnings = mysqlTable("author_earnings", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  bookId: int("bookId").notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0").notNull(),
  subscriptionEarnings: decimal("subscriptionEarnings", { precision: 12, scale: 2 }).default("0").notNull(),
  purchaseEarnings: decimal("purchaseEarnings", { precision: 12, scale: 2 }).default("0").notNull(),
  uniqueReaders: int("uniqueReaders").default(0).notNull(),
  monetizedReadCount: int("monetizedReadCount").default(0).notNull(),
  lastCalculatedAt: timestamp("lastCalculatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthorEarnings = typeof authorEarnings.$inferSelect;

// ─── Subscription Payments (Payment Tracking) ─────────────────────────────────
export const subscriptionPayments = mysqlTable("subscription_payments", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "mercadopago", "stripe", "paypal"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  paymentData: text("paymentData"),
  paidAt: timestamp("paidAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
