import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Crown, Zap, BookOpen } from "lucide-react";

interface PremiumBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
  currentPlan?: string;
}

export default function PremiumBlockModal({
  open,
  onOpenChange,
  bookTitle,
  currentPlan = "free",
}: PremiumBlockModalProps) {
  const isPremiumContent = true;
  const isFree = currentPlan === "free";
  const isBasic = currentPlan === "basico";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-lg opacity-50" />
              <Crown className="h-12 w-12 text-amber-600 relative" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-serif">Conteúdo Premium</DialogTitle>
          <DialogDescription className="text-base mt-2">
            "{bookTitle}" é exclusivo para assinantes Premium
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Seu plano atual: <span className="font-semibold capitalize">{currentPlan}</span>
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Com Premium você ganha:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>Acesso a todos os livros exclusivos</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>Sem anúncios durante a leitura</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Crown className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>Suporte prioritário e acesso antecipado</span>
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Premium</span>
              <div>
                <span className="text-2xl font-bold text-amber-900">R$ 14,99</span>
                <span className="text-xs text-muted-foreground ml-1">/mês</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Talvez depois
          </Button>
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            <Link href="/planos">
              <Crown className="h-4 w-4 mr-2" />
              Assinar Premium
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Cancele sua assinatura quando quiser, sem compromisso.
        </p>
      </DialogContent>
    </Dialog>
  );
}
