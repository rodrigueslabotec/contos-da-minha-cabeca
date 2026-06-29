import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import DonorBadge from "@/components/DonorBadge";
import { Button } from "@/components/ui/button";
import { Award, Crown, Medal, Trophy, Lock, Heart } from "lucide-react";
import { Link } from "wouter";

export default function DonationRanking() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: ranking } = trpc.donations.ranking.useQuery(undefined, { enabled: isAuthenticated });
  const { data: badges } = trpc.donations.myBadges.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Acesso necessário</h2>
          <p className="text-muted-foreground mb-6">Faça login para ver o ranking de doadores.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Entrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border/60 bg-card">
        <div className="container py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
            <Trophy className="h-3.5 w-3.5" /> Ranking Mensal
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
            Ranking de Doadores
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Os maiores apoiadores da plataforma neste mês.
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Podium */}
        {ranking && ranking.ranking.length > 0 ? (
          <div className="max-w-lg mx-auto mb-12">
            <div className="grid grid-cols-3 gap-4 items-end">
              {ranking.ranking.map((entry) => {
                const badgeType = entry.position === 1 ? "gold" : entry.position === 2 ? "silver" : "bronze";
                const heights = { 1: "h-32", 2: "h-24", 3: "h-20" };
                return (
                  <div key={entry.position} className="flex flex-col items-center gap-2">
                    <div className="text-center">
                      <DonorBadge type={badgeType} showLabel />
                    </div>
                    <div className={`w-full ${heights[entry.position as keyof typeof heights]} rounded-t-xl ${
                      entry.position === 1 ? "bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-400" :
                      entry.position === 2 ? "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300" :
                      "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-600"
                    } flex items-center justify-center`}>
                      <span className="font-serif text-3xl font-bold text-muted-foreground">#{entry.position}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">Doador</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 max-w-lg mx-auto">
            <Award className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold mb-2">Nenhum doador neste mês</h2>
            <p className="text-muted-foreground mb-6">Seja o primeiro a aparecer no ranking!</p>
            <Button asChild>
              <Link href="/doar" className="gap-2">
                <Heart className="h-4 w-4" /> Fazer uma Doação
              </Link>
            </Button>
          </div>
        )}

        {/* My badges */}
        {badges && badges.length > 0 && (
          <div className="max-w-lg mx-auto">
            <div className="section-divider mb-10" />
            <h2 className="font-serif text-2xl font-bold text-center text-foreground mb-6">
              Meus Badges
            </h2>
            <div className="space-y-3">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <DonorBadge type={badge.badgeType as "gold" | "silver" | "bronze"} showLabel />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {badge.month} · #{badge.position}º lugar
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
