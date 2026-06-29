import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import AdBanner from "@/components/AdBanner";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Sun, Moon,
  Type, BookOpen, List, X, QrCode
} from "lucide-react";
import { Link as WouterLink } from "wouter";

export default function Reader() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [fontSize, setFontSize] = useState(18);
  const [isDark, setIsDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);

  const bookIdNum = parseInt(bookId ?? "0");
  const chapterIdNum = parseInt(chapterId ?? "0");

  const { data: chapter, isLoading, error } = trpc.books.readChapter.useQuery(
    { chapterId: chapterIdNum },
    { enabled: !!chapterIdNum && isAuthenticated }
  );
  const { data: chapters } = trpc.books.chapters.useQuery(
    { bookId: bookIdNum },
    { enabled: !!bookIdNum }
  );
  const { data: book } = trpc.books.byId.useQuery(
    { id: bookIdNum },
    { enabled: !!bookIdNum }
  );

  const saveProgress = trpc.books.saveProgress.useMutation();
  const recordRead = trpc.books.recordRead.useMutation();

  const currentIndex = chapters?.findIndex((c) => c.id === chapterIdNum) ?? -1;
  const prevChapter = currentIndex > 0 ? chapters?.[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < (chapters?.length ?? 0) - 1 ? chapters?.[currentIndex + 1] : null;

  useEffect(() => {
    if (chapter && isAuthenticated) {
      saveProgress.mutate({ bookId: bookIdNum, chapterId: chapterIdNum, progress: 50 });
      if (book) {
        recordRead.mutate({ authorId: book.authorId });
      }
    }
  }, [chapter?.id, book?.authorId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold mb-2">Acesso necessário</h2>
          <p className="text-muted-foreground mb-4">Faça login para ler este livro.</p>
          <Button asChild><Link href="/">Voltar ao início</Link></Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 w-full max-w-2xl px-4">
          <div className="h-6 bg-muted rounded w-1/3 mx-auto" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold mb-2">Acesso negado</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" asChild><Link href={`/livro/${bookId}`}>Ver livro</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isDark ? "dark" : ""}`}>
      <AdBanner />
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/livro/${bookIdNum}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Link>
          </Button>
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">Capítulo {currentIndex + 1}</p>
            <p className="text-sm font-medium truncate max-w-xs">{chapter?.title ?? `Capítulo ${currentIndex + 1}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToc(!showToc)}
            className="gap-1.5"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Capítulos</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-1.5"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Fonte</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <WouterLink href="/doar" className="gap-1.5">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Apoiar</span>
            </WouterLink>
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-14 right-4 z-50 w-64 rounded-xl border border-border shadow-xl p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Tamanho da fonte</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSettings(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs">A</span>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={14}
              max={26}
              step={1}
              className="flex-1"
            />
            <span className="text-lg font-serif">A</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">{fontSize}px</p>
        </div>
      )}

      {/* TOC Panel */}
      {showToc && chapters && (
        <div className="fixed top-14 left-0 right-0 sm:left-auto sm:right-4 z-50 sm:w-72 max-h-96 overflow-y-auto rounded-xl border border-border shadow-xl bg-card">
          <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-inherit">
            <span className="text-sm font-medium">Capítulos ({chapters.length})</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowToc(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-2">
            {chapters.map((ch, i) => (
              <button
                key={ch.id}
                onClick={() => {
                  navigate(`/ler/${bookIdNum}/${ch.id}`);
                  setShowToc(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  ch.id === chapterIdNum
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary/60"
                }`}
              >
                {i + 1}. {ch.title ?? `Capítulo ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {chapter && (
          <>
            <h1
              className="font-serif font-bold text-center mb-2 leading-tight"
              style={{ fontSize: `${fontSize + 8}px` }}
            >
              {chapter.title ?? `Capítulo ${currentIndex + 1}`}
            </h1>
            <div className="section-divider mb-10" />
            <div
              className="reading-content whitespace-pre-line"
              style={{ fontSize: `${fontSize}px` }}
            >
              {chapter.content ?? "Conteúdo não disponível."}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-16 pt-8 border-t border-border/40">
          {prevChapter ? (
            <Button variant="outline" asChild>
              <Link href={`/ler/${bookIdNum}/${prevChapter.id}`}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Link>
            </Button>
          ) : (
            <div />
          )}
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {chapters?.length ?? 1}
          </span>
          {nextChapter ? (
            <Button variant="default" asChild>
              <Link href={`/ler/${bookIdNum}/${nextChapter.id}`}>
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/livro/${bookIdNum}`}>
                Concluído <BookOpen className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
