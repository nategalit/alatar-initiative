import { prisma } from "./prisma"

const DEFAULT_EMAIL = "local@alatar.app"

export async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: { email: DEFAULT_EMAIL, password: "" },
    select: { id: true },
  })
  return user.id
}
