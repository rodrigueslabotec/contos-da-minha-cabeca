import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, Users, BookOpen, Clock, CheckCircle, XCircle,
  DollarSign, BarChart3, AlertTriangle, Eye, Ban, Crown,
  TrendingUp, BookMarked
} from "lucide-react";
import { Link } from "wouter";

export default function AdminPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const [rejectBookId, setRejectBookId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzingBookId, setAnalyzingBookId] = useState<number | null>(null);

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: pendingBooks } = trpc.admin.pendingBooks.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allBooks } = trpc.admin.allBooks.useQuery({ page: 1 }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: users } = trpc.admin.users.useQuery({ page: 1 }, { enabled: isAuthenticated && user?.role === "admin" });
  const approveBook = trpc.admin.approveBook.useMutation({
    onSuccess: () => { toast.success("Livro aprovado e publicado!"); utils.admin.pendingBooks.invalidate(); utils.admin.allBooks.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const rejectBook = trpc.admin.rejectBook.useMutation({
    onSuccess: () => { toast.success("Livro rejeitado."); setRejectBookId(null); setRejectReason(""); utils.admin.pendingBooks.invalidate(); utils.admin.allBooks.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const unpublish = trpc.admin.unpublishBook.useMutation({
    onSuccess: () => { toast.success("Livro despublicado."); utils.admin.allBooks.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: () => { toast.success("Usuário atualizado."); utils.admin.users.invalidate(); },
  });

  const promoteUser = trpc.admin.promoteUser.useMutation({
    onSuccess: () => { toast.success("Papel atualizado."); utils.admin.users.invalidate(); },
  });

  const analyzeBook = trpc.admin.analyzeBook.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success("Análise concluída!");
    },
    onError: (e) => toast.error(`Erro na análise: ${e.message}`),
    onSettled: () => setAnalyzingBookId(null),
  });

  if (loading) return <div className="min-h-screen bg-background"><Navbar /></div>;

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">Esta área é exclusiva para administradores.</p>
          <Button asChild variant="outline"><Link href="/">Voltar ao início</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm">Gerencie toda a plataforma</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-muted-foreground" },
              { label: "Livros Publicados", value: stats.totalBooks, icon: BookOpen, color: "text-muted-foreground" },
              { label: "Leituras Totais", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-muted-foreground" },
              { label: "Pendentes", value: stats.pendingBooks, icon: Clock, color: "text-muted-foreground" },
              { label: "Doações (R$)", value: (stats.totalDonations ?? 0).toFixed(2).replace(".", ","), icon: DollarSign, color: "text-primary" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className={`font-serif text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Pendentes
              {pendingBooks && pendingBooks.length > 0 && (
                <span className="ml-1 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center px-1">
                  {pendingBooks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-1.5">
              <BookMarked className="h-3.5 w-3.5" /> Todos os Livros
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Comissões
            </TabsTrigger>
          </TabsList>

          {/* Pending Books */}
          <TabsContent value="pending">
            {pendingBooks && pendingBooks.length > 0 ? (
              <div className="space-y-4">
                {pendingBooks.map((book) => (
                  <div key={book.id} className="p-5 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="h-16 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-foreground">{book.title}</h3>
                          {book.subtitle && <p className="text-sm text-muted-foreground">{book.subtitle}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              book.contentRating === "18+" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              book.contentRating === "14+" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            }`}>
                              {book.contentRating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Autor #{book.authorId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(book.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {book.synopsis && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.synopsis}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => {
                            setAnalyzingBookId(book.id);
                            analyzeBook.mutate({ bookId: book.id });
                          }}
                          disabled={analyzeBook.isPending || analyzingBookId === book.id}
                        >
                          <BarChart3 className="h-3.5 w-3.5" /> {analyzingBookId === book.id ? "Analisando..." : "Análise de Moderação por IA"}
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-primary hover:bg-primary/80 text-primary-foreground"
                          onClick={() => approveBook.mutate({ bookId: book.id })}
                          disabled={approveBook.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => setRejectBookId(book.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">Nenhum livro pendente</h3>
                <p className="text-muted-foreground">Todos os livros foram revisados.</p>
              </div>
            )}

            {/* Analysis Result Card */}
            {analysisResult && (
              <div className="mt-8 p-6 rounded-xl border-2 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-1">Análise de Moderação — {analysisResult.bookTitle}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(analysisResult.analyzedAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAnalysisResult(null)}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Resumo */}
                  <div className="bg-card rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-muted-foreground" /> Resumo do Conteúdo
                    </h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.analysis.resumo}</p>
                  </div>

                  {/* Classificação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Classificação Etária
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          analysisResult.analysis.classificacaoValidada === "Adequada" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          analysisResult.analysis.classificacaoValidada === "Muito Restritiva" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {analysisResult.analysis.classificacaoValidada}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{analysisResult.analysis.motivoClassificacao}</p>
                    </div>

                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" /> Qualidade Editorial
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                            style={{ width: `${(analysisResult.analysis.qualidadeGeral / 10) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm">{analysisResult.analysis.qualidadeGeral}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Erros Gramaticais */}
                  {analysisResult.analysis.errosGramaticais && analysisResult.analysis.errosGramaticais.length > 0 && (
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" /> Erros Encontrados ({analysisResult.analysis.errosGramaticais.length})
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {analysisResult.analysis.errosGramaticais.slice(0, 5).map((erro: string, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-destructive flex-shrink-0">•</span>
                            <span>{erro}</span>
                          </li>
                        ))}
                        {analysisResult.analysis.errosGramaticais.length > 5 && (
                          <li className="text-xs text-muted-foreground italic">... e mais {analysisResult.analysis.errosGramaticais.length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Recomendações */}
                  {analysisResult.analysis.recomendacoes && analysisResult.analysis.recomendacoes.length > 0 && (
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" /> Recomendações
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {analysisResult.analysis.recomendacoes.map((rec: string, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary flex-shrink-0">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* All Books */}
          <TabsContent value="books">
            {allBooks?.items && allBooks.items.length > 0 ? (
              <div className="space-y-3">
                {allBooks.items.map((book) => {
                  const statusColors: Record<string, string> = {
                    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    draft: "bg-muted text-muted-foreground",
                    unpublished: "bg-muted text-muted-foreground",
                  };
                  const statusLabels: Record<string, string> = {
                    approved: "Publicado", pending: "Pendente", rejected: "Rejeitado",
                    draft: "Rascunho", unpublished: "Despublicado",
                  };
                  return (
                    <div key={book.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                      <div className="h-14 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-semibold truncate">{book.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[book.status] ?? "bg-muted text-muted-foreground"}`}>
                            {statusLabels[book.status] ?? book.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            book.contentRating === "18+" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            book.contentRating === "14+" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}>
                            {book.contentRating}
                          </span>
                          {book.price && (
                            <span className="text-xs text-primary font-medium">
                              R$ {parseFloat(book.price).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {book.views}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {book.status === "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive text-xs"
                            onClick={() => unpublish.mutate({ bookId: book.id })}
                          >
                            Despublicar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum livro cadastrado.</p>
              </div>
            )}
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            {users?.items && users.items.length > 0 ? (
              <div className="space-y-3">
                {users.items.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {(u.displayName ?? u.name ?? "U").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{u.displayName ?? u.name ?? "Usuário"}</p>
                        {u.role === "admin" && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground">Admin</span>
                        )}
                        {u.isBanned && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Banido</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastro: {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        {u.birthDate && ` · Nasc: ${new Date(u.birthDate).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        onClick={() => banUser.mutate({ userId: u.id, isBanned: !u.isBanned })}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        {u.isBanned ? "Desbanir" : "Banir"}
                      </Button>
                      {u.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5"
                          onClick={() => promoteUser.mutate({ userId: u.id, role: "admin" })}
                        >
                          <Crown className="h-3.5 w-3.5" /> Admin
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
              </div>
            )}
          </TabsContent>

          {/* Donations */}
          <TabsContent value="donations">
            <div className="text-center py-12">
              <DollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">As doações são repassadas em parte aos autores como incentivo, proporcionais à audiência de cada um.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectBookId} onOpenChange={() => { setRejectBookId(null); setRejectReason(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Rejeitar Livro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {analysisResult && (
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Feedback da IA:</p>
                <p className="text-sm text-muted-foreground">{analysisResult.analysis.recomendacoes}</p>
              </div>
            )}
            <div>
              <Label className="text-sm mb-1.5 block">Motivo da Rejeição</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição para o autor..."
                className="min-h-24 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejectBookId(null); setRejectReason(""); }}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => rejectBookId && rejectBook.mutate({ bookId: rejectBookId, reason: rejectReason })}
              disabled={rejectBook.isPending || !rejectReason.trim()}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
