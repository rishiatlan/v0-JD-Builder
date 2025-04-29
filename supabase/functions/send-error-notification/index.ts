// Follow the setup instructions at https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { errorId, errorMessage, errorStack, context, recipients } = await req.json()

    // Create SMTP client
    const client = new SmtpClient()

    // Connect to SMTP server (using Supabase environment variables)
    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOSTNAME") || "smtp.gmail.com",
      port: 465,
      username: Deno.env.get("SMTP_USERNAME") || "",
      password: Deno.env.get("SMTP_PASSWORD") || "",
    })

    // Format the email content
    const timestamp = new Date().toISOString()
    const subject = `[ALERT] Atlan JD Builder Error: ${errorMessage.substring(0, 50)}...`

    let emailBody = `
      <h2>Error Alert: Atlan JD Builder</h2>
      <p><strong>Error ID:</strong> ${errorId || "N/A"}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <p><strong>Error Message:</strong> ${errorMessage}</p>
    `

    if (errorStack) {
      emailBody += `
        <h3>Error Stack:</h3>
        <pre>${errorStack}</pre>
      `
    }

    if (context) {
      emailBody += `
        <h3>Context:</h3>
        <pre>${JSON.stringify(context, null, 2)}</pre>
      `
    }

    emailBody += `
      <p>
        <a href="${Deno.env.get("APP_URL") || "https://jd-builder.atlan.com"}/admin/errors/${errorId}">
          View in Admin Dashboard
        </a>
      </p>
    `

    // Send the email to all recipients
    for (const recipient of recipients) {
      await client.send({
        from: Deno.env.get("SMTP_FROM") || "alerts@atlan.com",
        to: recipient,
        subject,
        content: emailBody,
        html: emailBody,
      })
    }

    // Close the connection
    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error sending notification email:", error)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
