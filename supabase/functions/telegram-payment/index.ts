
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const botToken = Deno.env.get('BOT_TOKEN')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log("Hello from Functions!")

serve(async (req) => {
    try {
        const url = new URL(req.url);
        // 1. Create Invoice Link
        if (req.method === 'POST') {
            const body = await req.json()

            // A. Create Invoice Action (Called from Frontend)
            if (body.action === 'create_invoice') {
                const { userId } = body;

                // Call Telegram API to create invoice link
                // Price is in "XTR" (Telegram Stars). 1 Star = 1 XTR unit (amount=1).
                // However, Telegram API expects `amount` in smallest units? 
                // For Stars: "Currency: XTR", amount in integer.
                // Let's assume price is 5 stars.

                const payload = {
                    title: "Premium Subscription",
                    description: "Unlock full statistics for 1 week",
                    payload: `premium_${userId}_${Date.now()}`, // Internal ID
                    provider_token: "", // Empty for Stars
                    currency: "XTR",
                    prices: [{ label: "1 Week", amount: 5 }], // 5 Stars
                    // photo_url: "..." // Optional image
                };

                const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!data.ok) {
                    throw new Error(data.description || 'Failed to create invoice');
                }

                return new Response(
                    JSON.stringify({ invoiceLink: data.result }),
                    { headers: { "Content-Type": "application/json" } },
                )
            }

            // B. Telegram Webhook Handling (Pre-checkout & Payment Success)
            // The user must set their bot webhook to this function URL.
            // https://api.telegram.org/bot<token>/setWebhook?url=https://<project>.supabase.co/functions/v1/telegram-payment

            if (body.pre_checkout_query) {
                // Always answer pre_checkout_query with ok=true
                const queryId = body.pre_checkout_query.id;
                await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
                });
                return new Response("OK");
            }

            if (body.message && body.message.successful_payment) {
                const payment = body.message.successful_payment;
                // Extract user ID from payload or message.from.id
                const userId = body.message.from.id;
                const payload = payment.invoice_payload; // e.g. "premium_12345_..."

                // Update User in Supabase
                // Add 7 days to current sub end or now

                // Get current profile
                const { data: profile } = await supabase.from('profiles').select('subscription_end_date').eq('id', userId).single();

                let newEnd = new Date();
                if (profile?.subscription_end_date && new Date(profile.subscription_end_date) > newEnd) {
                    newEnd = new Date(profile.subscription_end_date);
                }
                newEnd.setDate(newEnd.getDate() + 7); // Add 1 week

                await supabase.from('profiles').update({
                    subscription_end_date: newEnd.toISOString()
                }).eq('id', userId);

                return new Response("OK");
            }
        }

        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }
})
