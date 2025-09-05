import { redirect } from "next/navigation"

export default function Home() {
  // Redirecionar para login por padrão
  redirect("/login")
}
