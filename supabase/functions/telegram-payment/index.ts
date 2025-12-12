
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const botToken = Deno.env.get('BOT_TOKEN')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!botToken || !supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing env variables");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        // Check auth (optional, but good practice). 
        // Usually req.headers.get('Authorization') contains the user's JWT.

        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const body = await req.json()

        if (body.action === 'create_invoice') {
            const { userId } = body;

            // Updated Price: 80 Stars
            const payload = {
                title: "Premium Subscription",
                description: "1 Month Premium Access",
                payload: `premium_${userId}_${Date.now()}`,
                provider_token: "", // Empty for Stars
                currency: "XTR",
                prices: [{ label: "1 Month", amount: 80 }],
                subscription_period: 2592000 // 30 days in seconds (Auto-renewal)
            };

            const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.ok) {
                console.error(data);
                throw new Error(data.description || 'Failed to create invoice');
            }

            return new Response(
                JSON.stringify({ invoiceLink: data.result }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        // Webhook Handling

        // 1. Handle Pre-Checkout Query (required for payment to proceed)
        if (body.pre_checkout_query) {
            const queryId = body.pre_checkout_query.id;
            await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
            });
            return new Response("OK");
        }

        // 2. Handle Successful Payment
        if (body.message?.successful_payment) {
            const invoicePayload = body.message.successful_payment.invoice_payload; // "premium_USERID_TIME"

            console.log("Processing payment:", invoicePayload);

            if (invoicePayload?.startsWith('premium_')) {
                const parts = invoicePayload.split('_');
                const userId = parts[1];

                if (userId) {
                    // Calculate new end date (Now + 30 days)
                    // Ideally we should check if user is already premium and extend, but for MVP we set from now or extend if logic allows.
                    // Let's keep it simple: Expand 30 days from NOW or from CURRENT END if valid.

                    const { data: profile } = await supabase.from('profiles').select('subscription_end_date').eq('id', userId).single();

                    let endDate = new Date();
                    if (profile?.subscription_end_date && new Date(profile.subscription_end_date) > endDate) {
                        endDate = new Date(profile.subscription_end_date);
                    }

                    endDate.setDate(endDate.getDate() + 30); // Add 30 days

                    const { error } = await supabase.from('profiles').update({
                        is_premium: true, // Keep legacy flag true
                        subscription_end_date: endDate.toISOString()
                    }).eq('id', userId);

                    if (error) console.error("Database update failed:", error);
                    else console.log(`User ${userId} extended to ${endDate.toISOString()}`);
                }
            }
            return new Response("OK");
        }

        return new Response("OK", { headers: corsHeaders });

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            },
        )
    }
})
