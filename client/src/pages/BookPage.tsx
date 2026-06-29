import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import DonorBadge from "@/components/DonorBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  BookOpen, Star, Eye, Heart, Share2, AlertTriangle,
  Calendar, Tag, ChevronRight, ArrowLeft, QrCode,
} from "lucide-react";

const RATING_COLORS: Record<string, string> = {
  livre: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "14+": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "18+": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();

  const { data: book, isLoading } = trpc.books.bySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });
  const { data: ratings } = trpc.books.ratings.useQuery({ bookId: book?.id ?? 0 }, { enabled: !!book?.id });
  const { data: chapters } = trpc.books.chapters.useQuery({ bookId: book?.id ?? 0 }, { enabled: !!book?.id });
  const { data: access } = trpc.books.checkAccess.useQuery({ bookId: book?.id ?? 0 }, { enabled: !!book?.id && isAuthenticated });
  const { data: favorites } = trpc.books.myFavorites.useQuery(undefined, { enabled: isAuthenticated });

  const utils = trpc.useUtils();
  const favMutation = trpc.books.toggleFavorite.useMutation({
    onSuccess: () => utils.books.myFavorites.invalidate(),
  });

  const isFavorited = favorites?.some((f) => f.bookId === book?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Livro não encontrado</h2>
          <Button asChild variant="outline"><Link href="/catalogo">Voltar ao catálogo</Link></Button>
        </div>
      </div>
    );
  }

  const ratingColor = RATING_COLORS[book.contentRating] ?? RATING_COLORS["livre"];
  const canRead = isAuthenticated && access?.allowed;
  const firstChapter = chapters?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/catalogo" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Catálogo
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{book.title}</span>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Cover + Actions */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden shadow-xl aspect-[2/3] bg-muted">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <BookOpen className="h-16 w-16 text-primary/30" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!isAuthenticated ? (
                <Button className="w-full" onClick={() => (window.location.href = getLoginUrl())}>
                  Entrar para Ler
                </Button>
              ) : canRead && firstChapter ? (
                <Button className="w-full" asChild>
                  <Link href={`/ler/${book.id}/${firstChapter.id}`}>
                    <BookOpen className="mr-2 h-4 w-4" /> Ler Agora
                  </Link>
                </Button>
              ) : access && !access.allowed ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">{access.reason}</p>
                </div>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  <AlertTriangle className="mr-2 h-4 w-4" /> Acesso Restrito
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                    favMutation.mutate({ bookId: book.id });
                  }}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                  {isFavorited ? "Favoritado" : "Favoritar"}
                </Button>
                <Button variant="outline" size="icon" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copiado!");
                }}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {isAuthenticated && (
                <Button variant="secondary" className="w-full gap-2" asChild>
                  <Link href="/doar">
                    <QrCode className="h-4 w-4" /> Apoiar com PIX
                  </Link>
                </Button>
              )}
            </div>

            {/* Book Stats */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Leituras</span>
                <span className="font-medium">{book.views.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Avaliação</span>
                <span className="font-medium">
                  {book.ratingCount > 0 ? `${parseFloat(book.avgRating ?? "0").toFixed(1)} (${book.ratingCount})` : "Sem avaliações"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Publicado</span>
                <span className="font-medium">{new Date(book.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ratingColor}`}>
                  {book.contentRating === "livre" ? "Livre" : book.contentRating}
                </span>
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" /> Grátis
                </Badge>
              </div>
              <h1 className="font-serif text-4xl font-bold text-foreground leading-tight">{book.title}</h1>
              {book.subtitle && (
                <p className="text-xl text-muted-foreground mt-1 font-serif italic">{book.subtitle}</p>
              )}
            </div>

            {book.synopsis && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Sinopse</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{book.synopsis}</p>
              </div>
            )}

            {book.tags && (
              <div className="flex flex-wrap gap-2">
                {JSON.parse(book.tags ?? "[]").map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    <Tag className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Chapters */}
            {chapters && chapters.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
                  Capítulos ({chapters.length})
                </h2>
                <div className="space-y-2">
                  {chapters.map((ch, i) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/40 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {i + 1}. {ch.title ?? `Capítulo ${i + 1}`}
                      </span>
                      {isAuthenticated ? (
                        <Button size="sm" variant={canRead ? "ghost" : "outline"} asChild>
                          <Link href={`/ler/${book.id}/${ch.id}`}>Ler</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => (window.location.href = getLoginUrl())}>
                          Entrar para Ler
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Age Warning */}
            {book.contentRating !== "livre" && (
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                book.contentRating === "18+"
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
              }`}>
                <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  book.contentRating === "18+" ? "text-red-600" : "text-amber-600"
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${book.contentRating === "18+" ? "text-red-800 dark:text-red-400" : "text-amber-800 dark:text-amber-400"}`}>
                    Conteúdo {book.contentRating}
                  </p>
                  <p className={`text-xs mt-0.5 ${book.contentRating === "18+" ? "text-red-700 dark:text-red-500" : "text-amber-700 dark:text-amber-500"}`}>
                    {book.contentRating === "18+"
                      ? "Este livro contém conteúdo adulto. Acesso restrito a maiores de 18 anos."
                      : "Este livro contém conteúdo violento ou de terror. Acesso restrito a maiores de 14 anos."}
                  </p>
                </div>
              </div>
            )}

            {/* Ratings */}
            {ratings && ratings.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-foreground mb-4">
                  Avaliações ({ratings.length})
                </h2>
                <div className="space-y-4">
                  {ratings.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
