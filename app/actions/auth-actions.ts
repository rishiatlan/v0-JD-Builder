"use server"

// This is a stub implementation that doesn't actually do anything
// but provides the necessary functions for the app to work

export async function signOut() {
  console.log("Sign out called (stubbed)")
  // No actual sign out happens
  return { success: true }
}

export async function sendMagicLink(email: string) {
  console.log("Send magic link called (stubbed) for:", email)
  // No actual magic link is sent
  return { success: true }
}

export async function getCurrentUser() {
  // Return a stub user
  return {
    id: "stub-user-id",
    email: "user@atlan.com",
    full_name: "Atlan User",
  }
}
