import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import BookCard from "@/components/BookCard";
import { BookOpen, Sparkles, Shield, Star, ArrowRight, PenLine, Users, Library, Heart } from "lucide-react";

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k+";
  return n + (n >= 100 ? "+" : "");
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: featured } = trpc.books.featured.useQuery();
  const { data: recent } = trpc.books.recent.useQuery();
  const { data: topRated } = trpc.books.topRated.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: stats } = trpc.platform.stats.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-amber-600 blur-3xl" />
        </div>
        <div className="container relative py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-sm font-medium mb-6 animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma de histórias independentes
            </div>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in-up stagger-1">
              Transformando
              <span className="text-gold-gradient block">imaginação em histórias</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl animate-fade-in-up stagger-2">
              Descubra universos criados por autores independentes. Leia, avalie e apoie escritores que transformam suas ideias em literatura.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-in-up stagger-3">
              <Button
                size="lg"
                asChild
                className="bg-amber-500 hover:bg-amber-400 text-white border-0 shadow-lg shadow-amber-500/25"
              >
                <Link href="/catalogo">
                  Explorar Catálogo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Criar Conta Grátis
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/60 bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Library, label: "Livros publicados", value: stats ? formatCount(stats.totalBooks) : "—" },
              { icon: Users, label: "Autores ativos", value: stats ? formatCount(stats.totalAuthors) : "—" },
              { icon: BookOpen, label: "Leituras realizadas", value: stats ? formatCount(stats.totalReads) : "—" },
              { icon: Star, label: "Avaliações", value: stats ? formatCount(stats.totalRatings) : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="font-serif text-2xl font-bold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      {featured && featured.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Destaque</p>
                <h2 className="font-serif text-3xl font-bold text-foreground">Mais Lidos</h2>
              </div>
              <Link href="/catalogo" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featured.map((book) => (
                <BookCard key={book.id} {...book} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider mx-auto max-w-4xl" />

      {/* Top Rated */}
      {topRated && topRated.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Qualidade</p>
                <h2 className="font-serif text-3xl font-bold text-foreground">Melhor Avaliados</h2>
              </div>
              <Link href="/catalogo" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topRated.map((book) => (
                <BookCard key={book.id} {...book} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Explorar</p>
              <h2 className="font-serif text-3xl font-bold text-foreground">Categorias</h2>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.id}`}
                  className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Books */}
      {recent && recent.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Novidades</p>
                <h2 className="font-serif text-3xl font-bold text-foreground">Publicações Recentes</h2>
              </div>
              <Link href="/catalogo" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recent.map((book) => (
                <BookCard key={book.id} {...book} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Donation */}
      <section className="py-16 bg-secondary/30">
        <div className="container text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Apoie a Leitura</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
             Sua contribuição mantém viva essa comunidade de leitores e escritores. Cada doação, de qualquer valor, incentiva os autores a continuar criando e compartilhando histórias incríveis.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/doar"><Heart className="h-4 w-4" /> Fazer uma Doação</Link>
          </Button>
        </div>
      </section>

      {/* CTA Author */}
      <section className="py-20 hero-gradient text-white">
        <div className="container text-center">
          <PenLine className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="font-serif text-4xl font-bold mb-4">Você é escritor?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Publique suas histórias, alcance leitores e receba sua parte das doações da plataforma.
          </p>
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-white border-0"
            asChild
          >
            <Link href="/autor">Começar a Publicar</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 bg-card">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <span className="font-serif font-semibold text-foreground">Contos da Minha Cabeça</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Transformando imaginação em histórias. © {new Date().getFullYear()}
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/catalogo" className="hover:text-foreground transition-colors">Catálogo</Link>
              <Link href="/doar" className="hover:text-foreground transition-colors">Apoiar</Link>
              <Link href="/autor" className="hover:text-foreground transition-colors">Autores</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
