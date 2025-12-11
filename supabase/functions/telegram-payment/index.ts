
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

            const payload = {
                title: "Premium Subscription",
                description: "Unlock full statistics for 1 week",
                payload: `premium_${userId}_${Date.now()}`,
                provider_token: "", // Empty for Stars
                currency: "XTR",
                prices: [{ label: "1 Week", amount: 5 }]
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

        // Webhook fallback
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
