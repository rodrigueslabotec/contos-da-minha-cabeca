import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import DonorBadge from "@/components/DonorBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Heart, QrCode, Copy, Check, Gift, Users, Award,
  TrendingUp, HandHeart
} from "lucide-react";
import { Link } from "wouter";

const DONATION_AMOUNTS = [5, 10, 25, 50, 100];

export default function DonationPage() {
  const { user, isAuthenticated } = useAuth();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [pixModal, setPixModal] = useState<{
    qrCode?: string;
    copyPaste?: string;
    amount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: ranking } = trpc.donations.ranking.useQuery(undefined, { enabled: isAuthenticated });
  const { data: badges } = trpc.donations.badges.useQuery();
  const { data: myBadges } = trpc.donations.myBadges.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myTotal } = trpc.donations.myTotal.useQuery(undefined, { enabled: isAuthenticated });

  const createPix = trpc.donations.createPix.useMutation({
    onSuccess: (data) => {
      setPixModal({
        qrCode: data.qrCode,
        copyPaste: data.copyPaste,
        amount: data.amount,
      });
      toast.success("QR Code PIX gerado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDonate = (amount: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createPix.mutate({ amount });
  };

  const copyToClipboard = () => {
    if (pixModal?.copyPaste) {
      navigator.clipboard.writeText(pixModal.copyPaste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border/60 bg-card">
        <div className="container py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
            <Heart className="h-3.5 w-3.5" /> Apoie a Leitura
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
            Faça parte dessa história
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Sua contribuição mantém os livros gratuitos para todos e incentiva os autores a criar cada vez mais.
          </p>
        </div>
      </div>

      <div className="container py-16">
        {/* Donation amounts */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="grid grid-cols-5 gap-3 mb-4">
            {DONATION_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedAmount === amount
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <span className="font-serif text-lg font-bold text-foreground">R${amount}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center mb-6">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                placeholder="Outro valor"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              />
            </div>
            <Button
              size="lg"
              disabled={(!selectedAmount && !customAmount) || createPix.isPending}
              onClick={() => {
                const amount = selectedAmount ?? parseFloat(customAmount);
                if (amount < 1) { toast.error("Valor mínimo: R$ 1"); return; }
                handleDonate(amount);
              }}
              className="gap-2"
            >
              {createPix.isPending ? (
                "Gerando..."
              ) : (
                <><QrCode className="h-4 w-4" /> Doar com PIX</>
              )}
            </Button>
          </div>

          {myTotal && myTotal.currentMonth > 0 && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
              <p className="text-sm text-muted-foreground">Suas contribuições neste mês</p>
              <p className="font-serif text-2xl font-bold text-primary">
                R$ {myTotal.currentMonth.toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
        </div>

        {/* Current month donors ranking */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="section-divider mb-10" />
          <h2 className="font-serif text-2xl font-bold text-center text-foreground mb-2">
            Doadores do Mês
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Os 3 maiores doadores do mês ganham destaque especial.
          </p>

          {ranking && ranking.ranking.length > 0 ? (
            <div className="space-y-3">
              {ranking.ranking.map((entry) => (
                <div
                  key={entry.position}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold text-primary">
                      #{entry.position}
                    </span>
                    <DonorBadge type={entry.position === 1 ? "gold" : entry.position === 2 ? "silver" : "bronze"} showLabel />
                  </div>
                  <span className="text-sm text-muted-foreground">Doador</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum doador neste mês ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Seja o primeiro!</p>
            </div>
          )}
        </div>

        {/* Badges showcase */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="section-divider mb-10" />
          <h2 className="font-serif text-2xl font-bold text-center text-foreground mb-2">
            Como funciona?
          </h2>
          <div className="grid gap-4 mt-8">
            {[
              { icon: HandHeart, title: "Contribuição Voluntária", desc: "Escolha quanto quer doar. Qualquer valor é bem-vindo!" },
              { icon: TrendingUp, title: "Ranking Mensal", desc: "Os 3 maiores doadores do mês recebem medalhas de Ouro, Prata e Bronze." },
              { icon: Gift, title: "Badges Permanentes", desc: "Ao doar todo mês, seu badge fica ativo permanentemente, mesmo fora do top 3." },
              { icon: Users, title: "Incentivo aos Autores", desc: "Sua doação chega até os autores como incentivo para que continuem criando as histórias que você ama ler." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <div className="section-divider mb-10" />
          <h2 className="font-serif text-2xl font-bold text-center text-foreground mb-8">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              { q: "Como funciona o pagamento via PIX?", a: "Após escolher o valor, você receberá um QR Code para escanear com seu banco. O pagamento é instantâneo." },
              { q: "Preciso doar para ler os livros?", a: "Não! Todos os livros são gratuitos. A doação é voluntária e ajuda a manter a plataforma." },
              { q: "Como os badges funcionam?", a: "Quem doa qualquer valor a cada mês ganha badges permanentes. O top 3 do mês ganha badges de Ouro, Prata e Bronze no ranking." },
              { q: "Autores recebem quanto?", a: "Os autores recebem uma parte das doações como reconhecimento e incentivo. Cada leitor que um autor conquista aumenta sua participação nos repasses — isso estimula a produção de conteúdo de qualidade para você." },
              { q: "Meu pagamento é seguro?", a: "Sim. Todos os pagamentos são processados pela Mercado Pago. Seus dados bancários nunca são compartilhados." },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PIX Modal */}
      <Dialog open={!!pixModal} onOpenChange={(open) => !open && setPixModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code PIX</DialogTitle>
          </DialogHeader>

          {pixModal && (
            <div className="space-y-6">
              {pixModal.qrCode && (
                <div className="flex justify-center">
                  <img
                    src={pixModal.qrCode}
                    alt="QR Code PIX"
                    className="w-64 h-64 rounded-lg border-2 border-primary/30"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Ou copie a chave PIX:</p>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-lg border border-border bg-muted/50 text-xs font-mono break-all">
                    {pixModal.copyPaste}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground font-medium mb-1">Valor:</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {pixModal.amount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <Button className="w-full" variant="outline" onClick={() => setPixModal(null)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
