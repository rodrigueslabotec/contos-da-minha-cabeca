import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import DonorBadge from "@/components/DonorBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, BookOpen, Heart, Clock, Edit2, Save, X, AlertCircle, Award, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const utils = trpc.useUtils();
  const { data: favorites } = trpc.books.myFavorites.useQuery(undefined, { enabled: isAuthenticated });
  const { data: history } = trpc.books.readingHistory.useQuery(undefined, { enabled: isAuthenticated });
  const { data: donations } = trpc.donations.myDonations.useQuery(undefined, { enabled: isAuthenticated });
  const { data: badges } = trpc.donations.myBadges.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myTotal } = trpc.donations.myTotal.useQuery(undefined, { enabled: isAuthenticated });

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setEditing(false);
      utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div className="h-6 bg-muted rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Acesso necessário</h2>
          <p className="text-muted-foreground mb-6">Faça login para ver seu perfil.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Entrar</Button>
        </div>
      </div>
    );
  }

  const initials = (user.displayName ?? user.name ?? "U").slice(0, 2).toUpperCase();

  const startEdit = () => {
    setDisplayName(user.displayName ?? user.name ?? "");
    setBio(user.bio ?? "");
    setBirthDate(user.birthDate ?? "");
    setEditing(true);
  };

  const saveProfile = () => {
    updateProfile.mutate({ displayName, bio, birthDate: birthDate || undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 p-6 rounded-2xl border border-border bg-card">
          <Avatar className="h-20 w-20 border-2 border-border shadow-md">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-serif font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Nome de exibição</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="max-w-xs" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Data de nascimento</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="max-w-xs" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Necessária para acessar conteúdos com classificação etária.
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Biografia</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    rows={3}
                    className="max-w-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProfile} disabled={updateProfile.isPending} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-serif text-2xl font-bold text-foreground">
                    {user.displayName ?? user.name}
                  </h1>
                  {user.role === "admin" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                {user.bio && <p className="text-sm text-foreground/80 mb-2">{user.bio}</p>}
                {!user.birthDate && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Informe sua data de nascimento para acessar conteúdos com classificação etária.
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5 mt-1">
                  <Edit2 className="h-3.5 w-3.5" /> Editar Perfil
                </Button>
              </>
            )}
          </div>

          {/* Donor Badges */}
          {badges && badges.length > 0 && (
            <div className="text-right flex flex-wrap gap-1 justify-end">
              {badges.map((b) => (
                <DonorBadge key={b.id} type={b.badgeType as "gold" | "silver" | "bronze"} showLabel />
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites">
          <TabsList className="mb-6">
            <TabsTrigger value="favorites" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Favoritos
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="donations" className="gap-1.5">
              <Award className="h-3.5 w-3.5" /> Doações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="text-sm text-muted-foreground p-3 rounded-lg border border-border bg-card">
                    Livro #{fav.bookId}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum livro favoritado ainda.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/catalogo">Explorar catálogo</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div>
                      <p className="text-sm font-medium">Livro #{h.bookId}</p>
                      <p className="text-xs text-muted-foreground">
                        Última leitura: {new Date(h.lastReadAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Progresso</p>
                        <p className="text-sm font-semibold">{h.progress ?? 0}%</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/ler/${h.bookId}/${h.chapterId ?? 1}`}>Continuar</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma leitura registrada ainda.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="donations">
            {myTotal && myTotal.total > 0 && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6 text-center">
                <p className="text-sm text-muted-foreground">Total doado</p>
                <p className="font-serif text-3xl font-bold text-primary">
                  R$ {myTotal.total.toFixed(2).replace(".", ",")}
                </p>
              </div>
            )}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {badges.map((b) => (
                  <DonorBadge key={b.id} type={b.badgeType as "gold" | "silver" | "bronze"} showLabel />
                ))}
              </div>
            )}
            {donations && donations.length > 0 ? (
              <div className="space-y-3">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div>
                      <p className="text-sm font-medium">
                        Doação · {d.month}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("pt-BR")} · {d.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        R$ {parseFloat(d.amount).toFixed(2).replace(".", ",")}
                      </p>
                      <p className={`text-xs px-2 py-0.5 rounded-full ${
                        d.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        d.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {d.status === "paid" ? "Confirmado" : d.status === "pending" ? "Pendente" : "Falhou"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma doação registrada ainda.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/doar">Fazer uma doação</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
