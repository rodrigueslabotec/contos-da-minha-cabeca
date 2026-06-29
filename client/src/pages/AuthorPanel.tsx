import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  PenLine, BookOpen, Plus, Clock, CheckCircle, XCircle,
  AlertCircle, TrendingUp, DollarSign, Eye, Upload, X
} from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG = {
  draft: { label: "Rascunho", icon: Clock, className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  pending: { label: "Aguardando aprovação", icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  approved: { label: "Publicado", icon: CheckCircle, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Rejeitado", icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  unpublished: { label: "Despublicado", icon: AlertCircle, className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export default function AuthorPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [contentRating, setContentRating] = useState<"livre" | "14+" | "18+">("livre");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: myBooks, isLoading } = trpc.author.myBooks.useQuery(undefined, { enabled: isAuthenticated });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: donationShare } = trpc.author.donationShare.useQuery(undefined, { enabled: isAuthenticated });
  const { data: readerCount } = trpc.author.readerCount.useQuery(undefined, { enabled: isAuthenticated });

  const submitBook = trpc.author.submit.useMutation({
    onSuccess: () => {
      toast.success("Livro enviado para aprovação!");
      setShowForm(false);
      setTitle(""); setSubtitle(""); setSynopsis(""); setCategoryId(""); setTags("");
      utils.author.myBooks.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="min-h-screen bg-background"><Navbar /></div>;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Área do Autor</h2>
          <p className="text-muted-foreground mb-6">Faça login para acessar o painel do autor.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Entrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Painel do Autor</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas publicações e acompanhe suas comissões</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Livro
          </Button>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Sua cota do mês (50%)</span>
            </div>
            <p className="font-serif text-2xl font-bold text-primary">
              R$ {(donationShare ?? 0).toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">50% das doações ÷ leitores únicos</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Leitores únicos (mês)</span>
            </div>
            <p className="font-serif text-2xl font-bold text-primary">{readerCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">1 leitor = 1 voto na divisão</p>
          </div>
        </div>

        {/* Submit Form */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-border bg-card animate-fade-in-up">
            <h2 className="font-serif text-xl font-bold mb-5">Submeter Novo Livro</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block">Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do livro" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block">Subtítulo</Label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtítulo (opcional)" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Classificação de Conteúdo *</Label>
                <Select value={contentRating} onValueChange={(v) => setContentRating(v as "livre" | "14+" | "18+")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Livre — para todos os públicos</SelectItem>
                    <SelectItem value="14+">14+ — violência / terror</SelectItem>
                    <SelectItem value="18+">18+ — conteúdo adulto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block">Sinopse</Label>
                <Textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Descreva sua história..."
                  rows={4}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block">Tags (separadas por vírgula)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="magia, aventura, jovens" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block">Capa do Livro (JPG/PNG)</Label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input type="file" accept="image/jpeg,image/png" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setCoverFile(file); const reader = new FileReader(); reader.onload = (ev) => setCoverPreview(ev.target?.result as string); reader.readAsDataURL(file); } }} disabled={isUploading} />
                  </div>
                  {coverPreview && (
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block">Arquivo do Livro (PDF/EPUB)</Label>
                <Input type="file" accept=".pdf,.epub" onChange={(e) => setContentFile(e.target.files?.[0] || null)} disabled={isUploading} />
                {contentFile && <p className="text-xs text-muted-foreground mt-1">✓ {contentFile.name}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Atenção:</strong> Após a submissão, seu livro ficará em análise. O administrador irá revisar o conteúdo antes da publicação. Todos os livros são gratuitos para leitores.
              </div>
            </div>

            {isUploading && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Enviando arquivos...</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{uploadProgress}%</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button
                onClick={() => submitBook.mutate({
                  title,
                  subtitle: subtitle || undefined,
                  categoryId: categoryId ? parseInt(categoryId) : undefined,
                  synopsis: synopsis || undefined,
                  contentRating,
                  tags: tags ? JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)) : undefined,
                  coverUrl: undefined,
                  contentUrl: undefined,
                })}
                disabled={!title || submitBook.isPending || isUploading}
              >
                {submitBook.isPending ? "Enviando..." : isUploading ? "Enviando arquivos..." : "Enviar para Aprovação"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={isUploading}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="books">
          <TabsList className="mb-6">
            <TabsTrigger value="books" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Meus Livros
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Ganhos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : myBooks && myBooks.length > 0 ? (
              <div className="space-y-3">
                {myBooks.map((book) => {
                  const status = STATUS_CONFIG[book.status] ?? STATUS_CONFIG.draft;
                  const StatusIcon = status.icon;
                  return (
                    <div key={book.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors">
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
                        <h3 className="font-serif font-semibold text-foreground truncate">{book.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                            <StatusIcon className="h-3 w-3" /> {status.label}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {book.views}
                          </span>
                          {book.price && (
                            <span className="text-xs text-primary font-medium">
                              R$ {parseFloat(book.price).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </div>
                      </div>
                      {book.status === "approved" && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/livro/${book.slug}`}>Ver</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">Nenhum livro publicado</h3>
                <p className="text-muted-foreground mb-4">Comece submetendo seu primeiro livro.</p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Submeter Livro
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="earnings">
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                Seus ganhos são calculados mensalmente com base no número de leitores únicos.
              </p>
              <p className="text-sm text-muted-foreground">
                Os autores recebem uma parte das doações como incentivo por seu trabalho. Quanto mais leitores você atrai, maior sua participação nos repasses mensais.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
