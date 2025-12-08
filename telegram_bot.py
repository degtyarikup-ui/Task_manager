"""
Простой скрипт для настройки Telegram бота с кнопкой Web App

Требует установки библиотеки python-telegram-bot:
pip install python-telegram-bot

Использование:
1. Замените TOKEN на токен вашего бота
2. Замените WEB_APP_URL на URL вашего приложения
3. Запустите скрипт: python telegram_bot.py
4. Напишите боту /start
"""

from telegram import Update, WebAppInfo, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Application, CommandHandler, ContextTypes

# ========== НАСТРОЙКИ ==========
TOKEN = "ВАШ_ТОКЕН_ОТ_BOTFATHER"  # Получите у @BotFather
WEB_APP_URL = "https://ВАШ_USERNAME.github.io/task-manager-tg/"  # URL вашего приложения
# ================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отправить приветствие с кнопкой Web App"""
    
    # Создаем кнопку с Web App
    keyboard = ReplyKeyboardMarkup(
        [[KeyboardButton("📋 Открыть Task Manager", web_app=WebAppInfo(url=WEB_APP_URL))]],
        resize_keyboard=True
    )
    
    await update.message.reply_text(
        "👋 Привет! Нажми кнопку ниже, чтобы открыть Task Manager:",
        reply_markup=keyboard
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Показать помощь"""
    await update.message.reply_text(
        "🤖 Команды бота:\n\n"
        "/start - Открыть Task Manager\n"
        "/help - Показать эту помощь"
    )

def main() -> None:
    """Запустить бота"""
    if TOKEN == "ВАШ_ТОКЕН_ОТ_BOTFATHER":
        print("❌ Ошибка: Установите TOKEN в начале файла!")
        print("Получите токен у @BotFather в Telegram")
        return
    
    if "ВАШ_USERNAME" in WEB_APP_URL:
        print("❌ Ошибка: Установите WEB_APP_URL в начале файла!")
        print("Укажите ссылку на развернутое приложение")
        return
    
    # Создаем приложение
    application = Application.builder().token(TOKEN).build()
    
    # Добавляем обработчики команд
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    
    # Запускаем бота
    print(f"✅ Бот запущен!")
    print(f"📱 Web App URL: {WEB_APP_URL}")
    print(f"🚀 Напишите боту /start в Telegram")
    print("\nДля остановки нажмите Ctrl+C")
    
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
