import { prisma } from "../prisma";

export async function createNotification(
  userId: string,
  kind: string,
  title: string,
  body: string,
): Promise<void> {
  await prisma.notification.create({
    data: { userId, kind: kind as any, title, body },
  }).catch(() => {});
}
