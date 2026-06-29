import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import BookCard from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearch } from "wouter";

export default function Catalog() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const initialCategory = params.get("categoria") ? parseInt(params.get("categoria")!) : undefined;

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategory);
  const [contentRating, setContentRating] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data, isLoading } = trpc.books.list.useQuery({
    page,
    limit: 24,
    search: search || undefined,
    categoryId,
    contentRating,
  });

  const clearFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setContentRating(undefined);
    setPage(1);
  };

  const hasFilters = !!search || !!categoryId || !!contentRating;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="border-b border-border/60 bg-card">
        <div className="container py-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Catálogo</h1>
          <p className="text-muted-foreground">Explore todas as histórias disponíveis na plataforma</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar livros, autores..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          <Select
            value={categoryId?.toString() ?? "all"}
            onValueChange={(v) => { setCategoryId(v === "all" ? undefined : parseInt(v)); setPage(1); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={contentRating ?? "all"}
            onValueChange={(v) => { setContentRating(v === "all" ? undefined : v); setPage(1); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Classificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as idades</SelectItem>
              <SelectItem value="livre">Livre</SelectItem>
              <SelectItem value="14+">14+</SelectItem>
              <SelectItem value="18+">18+</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[2/3]" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-20">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Nenhum livro encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {data?.total ?? 0} {(data?.total ?? 0) === 1 ? "livro encontrado" : "livros encontrados"}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data?.items.map((book) => (
                <BookCard key={book.id} {...book} compact />
              ))}
            </div>

            {/* Pagination */}
            {data && data.total > 24 && (
              <div className="flex justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Página {page} de {Math.ceil(data.total / 24)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(data.total / 24)}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
