"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Email template for magic links
const EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Secure Magic Login Link</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f7fa; padding: 40px; color: #333333;">
  <table align="center" style="max-width: 600px; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <tr>
      <td>
        <h2 style="color: #082c4e; text-align: center;">Your Magic Login Link</h2>
        <p style="font-size: 16px; line-height: 1.6; text-align: center;">
          Click the button below to securely log in to your Atlan Job Description Builder account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{action_link}}" style="background-color: #1d4ed8; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; display: inline-block;">
            Log In Securely
          </a>
        </div>
        <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 20px;">
          This magic link is valid for a short time and can only be used once.
          <br>
          If you didn't request this login, you can safely ignore this email.
        </p>
        <p style="font-size: 12px; color: #aaaaaa; text-align: center; margin-top: 40px;">
          Sent with 💙 from Atlan
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`

export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function sendMagicLink(email: string) {
  try {
    // Create an admin client with the service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Generate the magic link with explicit redirect
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://v0-jd-builder-beta.vercel.app/auth/callback",
      },
    })

    if (error) {
      console.error("Error generating magic link:", error)
      return { success: false, error: error.message }
    }

    if (!data?.properties?.action_link) {
      console.error("No action link generated")
      return { success: false, error: "Failed to generate magic link" }
    }

    const magicLink = data.properties.action_link

    // For debugging
    console.log("Generated magic link:", magicLink)

    // Send the email with the magic link
    // Option 1: Using Resend (if you have it set up)
    if (process.env.RESEND_API_KEY) {
      const emailHtml = EMAIL_TEMPLATE.replace("{{action_link}}", magicLink)

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Atlan JD Builder <no-reply@atlan.com>",
          to: [email],
          subject: "Your Magic Link for Atlan JD Builder",
          html: emailHtml,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("Resend API error:", result)
        return { success: false, error: result.message || "Failed to send email" }
      }

      return { success: true }
    }

    // Option 2: Using Supabase's built-in email service as a fallback
    // Note: This won't use our custom template but will use the action_link
    const { error: emailError } = await supabaseAdmin.auth.admin.sendEmail(email, {
      type: "magiclink",
      actionLink: magicLink,
    })

    if (emailError) {
      console.error("Error sending email:", emailError)
      return { success: false, error: emailError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception sending magic link:", error)
    return { success: false, error: error.message || "Failed to send magic link" }
  }
}

export async function signOut() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception signing out:", error)
    return { success: false, error: error.message || "Failed to sign out" }
  }
}
