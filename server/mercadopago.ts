import axios from "axios";
import { ENV } from "./_core/env";

interface PixPaymentResponse {
  id: string;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_url?: string;
      copy_paste?: string;
    };
  };
}

export async function createPixDonation(amount: number, email: string, donationId: number): Promise<{
  paymentId: string;
  qrCode?: string;
  qrCodeUrl?: string;
  copyPaste?: string;
}> {
  const token = ENV.mercadoPagoAccessToken;
  if (!token) throw new Error("Mercado Pago não configurado");

  const response = await axios.post<PixPaymentResponse>(
    "https://api.mercadopago.com/v1/payments",
    {
      transaction_amount: amount,
      description: `Doação - Contos da Minha Cabeça`,
      payment_method_id: "pix",
      payer: {
        email: email || "doador@contosdaminhacabeca.com",
      },
      notification_url: `${ENV.frontendUrl || "http://localhost:3000"}/api/webhooks/mercadopago`,
      external_reference: donationId.toString(),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const payment = response.data;
  return {
    paymentId: payment.id,
    qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
    qrCodeUrl: payment.point_of_interaction?.transaction_data?.qr_code_url,
    copyPaste: payment.point_of_interaction?.transaction_data?.copy_paste,
  };
}

export async function getPaymentStatus(paymentId: string): Promise<{ status: string; amount: number; donationId?: number }> {
  const token = ENV.mercadoPagoAccessToken;
  if (!token) throw new Error("Mercado Pago não configurado");

  const response = await axios.get<{
    id: string;
    status: string;
    transaction_amount: number;
    external_reference?: string;
  }>(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    status: response.data.status,
    amount: response.data.transaction_amount,
    donationId: response.data.external_reference ? parseInt(response.data.external_reference) : undefined,
  };
}
