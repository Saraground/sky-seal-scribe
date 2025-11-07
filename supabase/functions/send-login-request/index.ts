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
        to: ["saraground@gmail.com"], // Temporary: Change to admin email after domain verification
        subject: "New Login Account Request",
        html: `
          <div style="background-color: #f9fafb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #1f2937;">New Login Account Request</h2>
              <p style="color: #6b7280;">A new user has requested login access to the Trolley Seal Management System.</p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;"><strong>Note:</strong> This email should be forwarded to <strong>saravanan_visuanathn@sats.com.sg</strong> until domain verification is complete.</p>
              </div>
              
              <h3 style="color: #374151; margin-top: 30px;">User Details:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Username:</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">${username}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">${email}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Staff Number:</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">${staffNumber}</td>
                </tr>
              </table>
              
              <p style="margin-top: 30px; color: #6b7280;">Please create an account for this user in the system.</p>
            </div>
          </div>
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
