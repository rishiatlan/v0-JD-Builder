"use server"

import { AuthService } from "@/lib/auth-service"
import { getSession, destroySession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  const result = await AuthService.signIn(email, password)
  return result
}

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  const result = await AuthService.signUp(email, password, { full_name: fullName })
  return result
}

export async function signOut() {
  await destroySession()
  redirect("/")
}

export async function getCurrentUser() {
  return await getSession()
}

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  const fullName = formData.get("full_name") as string

  const result = await AuthService.updateProfile(session.id, { full_name: fullName })
  return result
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}
