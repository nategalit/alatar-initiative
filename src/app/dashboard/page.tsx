import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-lg">
        Logged in as <strong>{session.user?.email}</strong>
      </p>
    </main>
  )
}
