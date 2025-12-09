# Реализация Telegram Напоминаний (Код готов!)

Я уже создал для вас весь необходимый код для Supabase Edge Functions. Он находится в папке `supabase/functions`.

Поскольку у меня нет доступа к вашему Supabase аккаунту и ключам, вам нужно выполнить финальные шаги самостоятельно.

## 1. Деплой функций

Откройте терминал в папке проекта и выполните:

```bash
# Логин (если не залогинены)
npx supabase login

# Деплой функций
npx supabase functions deploy send-reminders --no-verify-jwt
npx supabase functions deploy bot-webhook --no-verify-jwt
```
(Флаг `--no-verify-jwt` делает функцию публичной, что нужно для Webhook Telegram и простых Cron сервисов. Если хотите защитить - уберите флаг и настройте заголовки Authorization).

## 2. Установка секретов (Токена бота)

Вам нужно получить токен бота у @BotFather в Telegram.
Затем установите его в Supabase:

```bash
npx supabase secrets set TG_BOT_TOKEN=ваш_токен_здесь
```

## 3. Настройка Webhook

Чтобы кнопка "Завершить" работала, сообщите Telegram адрес вашего вебхука:

1. Скопируйте URL функции `bot-webhook` из вывода команды deploy (или из Dashboard). Обычно это `https://<project-ref>.supabase.co/functions/v1/bot-webhook`.
2. Выполните команду (в браузере или терминале):

```bash
curl "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=<URL_ФУНКЦИИ_WEBHOOK>"
```

## 4. Настройка расписания (Cron)

Чтобы `send-reminders` запускалась каждое утро:

1. Зайдите в Supabase Dashboard > Edge Functions > send-reminders.
2. Там может быть настройка расписания (или Invocation logs).
3. **Лучший способ:** Используйте бесплатный сервис [cron-job.org](https://cron-job.org) (или любой другой).
   - Создайте Job.
   - URL: `https://<project-ref>.supabase.co/functions/v1/send-reminders`
   - Schedule: Every day at 09:00.
   - Если функция защищена JWT, добавьте Header: `Authorization: Bearer <Ваш Supabase Anon Key>` (или Service Role Key).

Всё! Теперь система работает.
