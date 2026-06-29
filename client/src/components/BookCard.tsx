import { Link } from "wouter";
import { Star, Eye, BookOpen, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  id: number;
  title: string;
  subtitle?: string | null;
  slug: string;
  coverUrl?: string | null;
  contentRating: string;
  avgRating?: string | null;
  views?: number;
  price?: string | null;
  accessLevel?: string;
  authorName?: string;
  categoryName?: string;
  synopsis?: string | null;
  compact?: boolean;
}

const RATING_LABELS: Record<string, { label: string; className: string }> = {
  livre: { label: "Livre", className: "age-badge-livre" },
  "14+": { label: "14+", className: "age-badge-14" },
  "18+": { label: "18+", className: "age-badge-18" },
};

export default function BookCard({
  title,
  subtitle,
  slug,
  coverUrl,
  contentRating,
  avgRating,
  views,
  price,
  accessLevel,
  authorName,
  synopsis,
  compact = false,
}: BookCardProps) {
  const rating = RATING_LABELS[contentRating] ?? RATING_LABELS["livre"];
  const isPaid = !!price && parseFloat(price) > 0;
  const needsSubscription = accessLevel === "basic" || accessLevel === "premium";

  return (
    <Link href={`/livro/${slug}`} className="block group">
      <div className="book-card rounded-xl overflow-hidden bg-card border border-border/60 h-full flex flex-col">
        {/* Cover */}
        <div className={`relative overflow-hidden bg-muted ${compact ? "aspect-[2/3]" : "aspect-[2/3]"}`}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
              <BookOpen className="h-10 w-10 text-primary/40 mb-2" />
              <span className="text-xs text-center text-muted-foreground font-serif line-clamp-3">{title}</span>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rating.className}`}>
              {rating.label}
            </span>
          </div>

          {(isPaid || needsSubscription) && (
            <div className="absolute top-2 right-2">
              <div className="h-7 w-7 rounded-full bg-background/90 flex items-center justify-center shadow-sm">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <h3 className="font-serif text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>
          {subtitle && !compact && (
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
          {authorName && (
            <p className="text-xs text-muted-foreground">{authorName}</p>
          )}
          {synopsis && !compact && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{synopsis}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {avgRating && parseFloat(avgRating) > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {parseFloat(avgRating).toFixed(1)}
                </span>
              )}
              {views !== undefined && views > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                </span>
              )}
            </div>
            {isPaid ? (
              <span className="text-xs font-semibold text-primary">
                R$ {parseFloat(price!).toFixed(2).replace(".", ",")}
              </span>
            ) : needsSubscription ? (
              <span className="text-xs text-muted-foreground capitalize">{accessLevel}</span>
            ) : (
              <span className="text-xs text-emerald-600 font-medium">Grátis</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
