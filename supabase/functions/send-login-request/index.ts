import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const loginRequestSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100, "Username too long").regex(/^[a-zA-Z0-9\s._-]+$/, "Invalid username characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  staffNumber: z.string().trim().min(1, "Staff number is required").max(50, "Staff number too long").regex(/^[a-zA-Z0-9-]+$/, "Invalid staff number format")
});

interface LoginRequest {
  username: string;
  email: string;
  staffNumber: string;
}

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Check rate limiting
async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remainingRequests: number }> {
  const endpoint = "send-login-request";
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setMinutes(0, 0, 0); // Start of current hour
  
  // Try to get existing rate limit record
  const { data: existing } = await supabase
    .from("rate_limit_requests")
    .select("request_count")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();
  
  if (existing) {
    const newCount = existing.request_count + 1;
    
    if (newCount > RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remainingRequests: 0 };
    }
    
    // Update count
    await supabase
      .from("rate_limit_requests")
      .update({ request_count: newCount })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .eq("window_start", windowStart.toISOString());
    
    return { allowed: true, remainingRequests: RATE_LIMIT_MAX_REQUESTS - newCount };
  } else {
    // Create new record
    await supabase
      .from("rate_limit_requests")
      .insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: windowStart.toISOString()
      });
    
    return { allowed: true, remainingRequests: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: LoginRequest = await req.json();
    
    // Validate input
    const validationResult = loginRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    const { username, email, staffNumber } = validationResult.data;
    
    // Check rate limiting using email as identifier
    const rateLimitResult = await checkRateLimit(email);
    if (!rateLimitResult.allowed) {
      console.warn("Rate limit exceeded for:", email);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retryAfter: `${RATE_LIMIT_WINDOW_HOURS} hour(s)`
        }),
        { 
          status: 429, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("Login request received (validated):", { username, email, staffNumber });

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
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">${escapeHtml(username)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">${escapeHtml(email)}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Staff Number:</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">${escapeHtml(staffNumber)}</td>
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
