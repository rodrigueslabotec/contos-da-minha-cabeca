import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import DonorBadge from "@/components/DonorBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Menu, X, Shield, PenLine, User, LogOut, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: badges } = trpc.donations.myBadges.useQuery(undefined, { enabled: isAuthenticated });

  const navLinks = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/doar", label: "Apoiar" },
  ];

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.name?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-serif text-lg font-semibold text-foreground hidden sm:block">
              Contos da Minha Cabeça
            </span>
            <span className="font-serif text-lg font-semibold text-foreground sm:hidden">
              CMC
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === link.href
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.displayName ?? user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {badges && badges.length > 0 && (
                    <div className="px-2 py-1.5 flex flex-wrap gap-1">
                      {badges.map((b) => (
                        <DonorBadge key={b.id} type={b.badgeType as "gold" | "silver" | "bronze"} />
                      ))}
                    </div>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ranking" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="h-4 w-4" /> Ranking de Doadores
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/autor" className="flex items-center gap-2 cursor-pointer">
                      <PenLine className="h-4 w-4" /> Painel do Autor
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" /> Administração
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="hidden sm:flex"
              >
                Entrar
              </Button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/60 py-3 space-y-1 animate-fade-in-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-2 px-4">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Entrar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
