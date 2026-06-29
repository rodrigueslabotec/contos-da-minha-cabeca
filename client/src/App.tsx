import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import BookPage from "./pages/BookPage";
import Reader from "./pages/Reader";
import Profile from "./pages/Profile";
import AuthorPanel from "./pages/AuthorPanel";
import DonationPage from "./pages/DonationPage";
import DonationRanking from "./pages/DonationRanking";
import AdminPanel from "./pages/AdminPanel";
import DevLogin from "./pages/DevLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalogo" component={Catalog} />
      <Route path="/livro/:slug" component={BookPage} />
      <Route path="/ler/:bookId/:chapterId" component={Reader} />
      <Route path="/perfil" component={Profile} />
      <Route path="/autor" component={AuthorPanel} />
      <Route path="/doar" component={DonationPage} />
      <Route path="/ranking" component={DonationRanking} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/dev-login" component={DevLogin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
