import { Router } from "express";
import { getPaymentStatus } from "../mercadopago";
import { awardMonthlyBadges, getDonationsByUser, updateDonationStatus } from "../db";

export function registerWebhooks(app: Router) {
  // Mercado Pago PIX payment notification
  app.post("/api/webhooks/mercadopago", async (req, res) => {
    try {
      const { type, data } = req.body;
      if (type !== "payment" || !data?.id) {
        return res.status(200).json({ received: true });
      }

      const paymentId = data.id;
      const paymentInfo = await getPaymentStatus(paymentId);

      if (paymentInfo.status === "approved") {
        await updateDonationStatus(paymentId, "paid");
      } else if (paymentInfo.status === "rejected" || paymentInfo.status === "cancelled") {
        await updateDonationStatus(paymentId, "failed");
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(200).json({ received: true });
    }
  });
}
