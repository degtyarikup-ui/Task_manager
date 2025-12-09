import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    // Инициализация Supabase (Admin доступ - Service Role Key)
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const botToken = Deno.env.get('TG_BOT_TOKEN')!

    if (!botToken) {
        return new Response("TG_BOT_TOKEN is missing", { status: 500 })
    }

    // Получаем задачи на сегодня
    // Предполагаем формат 'YYYY-MM-DD' в базе
    const today = new Date().toISOString().split('T')[0]

    // Выбираем задачи с сегодняшним дедлайном, которые не завершены
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, user_id')
        .eq('deadline', today)
        .neq('status', 'completed')

    if (error) {
        console.error(error)
        return new Response(JSON.stringify(error), { status: 500 })
    }

    console.log(`Найдено ${tasks?.length || 0} задач для напоминания`)

    if (!tasks || tasks.length === 0) {
        return new Response(JSON.stringify({ message: 'No tasks for today' }), { status: 200 })
    }

    const results = []

    for (const task of tasks) {
        // Отправляем сообщение
        // user_id в базе должен быть корректным Telegram ID (число или строка)
        try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: task.user_id,
                    text: `🔔 *Напоминание*\n\nЗадача: ${task.title}\nДедлайн сегодня!`,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "✅ Завершить", callback_data: `complete:${task.id}` }
                        ]]
                    }
                })
            })
            const json = await res.json()
            results.push({ id: task.id, ok: json.ok })
        } catch (e) {
            console.error(`Failed to send to ${task.user_id}`, e)
            results.push({ id: task.id, ok: false, error: e })
        }
    }

    return new Response(JSON.stringify({ sent: results }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
