import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginRequest {
  username: string;
  email: string;
  staffNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, email, staffNumber }: LoginRequest = await req.json();

    console.log("Login request received:", { username, email, staffNumber });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Trolley Seal System <onboarding@resend.dev>",
        to: ["saravanan_visuanathn@sats.com.sg"],
        subject: "New Login Account Request",
        html: `
          <h2>New Login Account Request</h2>
          <p>A new user has requested login access to the Trolley Seal Management System.</p>
          <h3>User Details:</h3>
          <ul>
            <li><strong>Username:</strong> ${username}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Staff Number:</strong> ${staffNumber}</li>
          </ul>
          <p>Please create an account for this user.</p>
        `,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-login-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
