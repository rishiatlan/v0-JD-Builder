export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

export default function NewJDPage() {
  // This is a simple redirect page to the main JD builder
  redirect("/")
}
