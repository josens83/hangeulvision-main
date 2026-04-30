import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { generateReceiptPDF } from "../services/receipt-pdf.service";

export async function downloadReceipt(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { transactionId } = req.params;

  // First, look for a Payment record matching this transaction ID
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      OR: [{ id: transactionId }, { providerRef: transactionId }],
    },
  });

  if (payment) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, tier: true, subscriptionPlan: true },
    });

    const isSubscription = payment.kind === "subscription";
    const pdf = await generateReceiptPDF({
      transactionId: payment.providerRef ?? payment.id,
      userName: user?.name ?? "Customer",
      userEmail: user?.email ?? "",
      productName: isSubscription
        ? `HangeulVision ${(user?.tier ?? "free").charAt(0).toUpperCase() + (user?.tier ?? "free").slice(1)}`
        : payment.productId,
      amount: payment.amountUSD.toString(),
      currency: payment.currency,
      date: payment.createdAt,
      type: isSubscription ? "subscription" : "one_time",
      plan: isSubscription
        ? user?.subscriptionPlan?.replace(/_/g, " ") ?? undefined
        : undefined,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${transactionId}.pdf"`,
    );
    res.send(pdf);
    return;
  }

  // Fall back: check if this is a UserPurchase ID
  const purchase = await prisma.userPurchase.findFirst({
    where: { userId, id: transactionId },
    include: { package: true },
  });

  if (!purchase) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const pdf = await generateReceiptPDF({
    transactionId: purchase.id,
    userName: user?.name ?? "Customer",
    userEmail: user?.email ?? "",
    productName: purchase.package?.name ?? purchase.exam,
    amount: purchase.package?.priceUSD?.toString() ?? "19.99",
    currency: "USD",
    date: purchase.createdAt,
    type: "one_time",
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="receipt-${transactionId}.pdf"`,
  );
  res.send(pdf);
}
