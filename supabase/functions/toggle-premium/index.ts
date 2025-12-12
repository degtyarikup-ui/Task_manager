
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { userId, isPremium } = await req.json()

        // Security: Whitelist Dev IDs only
        if (userId !== 6034524743 && userId !== 906251783) {
            return new Response(JSON.stringify({ error: "Unauthorized: Dev Only" }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!userId) throw new Error("Missing userId")

        if (isPremium) {
            // Create License Task
            const { error } = await supabase.from('tasks').insert({
                user_id: userId,
                title: "⭐️ Premium License",
                status: "completed",
                priority: "low",
                deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            });
            if (error) throw error;
        } else {
            // Delete License Task
            const { error } = await supabase.from('tasks').delete()
                .eq('user_id', userId)
                .eq('title', '⭐️ Premium License');
            if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (e: any) {
        console.error(e)
        return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
