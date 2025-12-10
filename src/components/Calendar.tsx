import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfDay, type Locale } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Calendar.module.css';

interface CalendarProps {
    selectedDate: string | null;
    onChange: (date: string) => void;
    onClose: () => void;
    locale: Locale;
    todayLabel: string;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onChange, onClose, locale, todayLabel }) => {
    const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());

    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Generate days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1, locale });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1, locale });

    // Generate specific week days based on locale
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1, locale });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1, locale });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(d => format(d, 'EEEEEE', { locale }));

    const dateList = eachDayOfInterval({ start: startDate, end: endDate });

    const handleDateClick = (day: Date) => {
        // Form 'yyyy-MM-dd' keeping local time logic simply
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const d = String(day.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
        onClose();
    };



    const handleToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
        onClose();
    }

    return createPortal(
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.calendarContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>
                        {format(currentMonth, 'LLLL yyyy', { locale })}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className={styles.navBtn} onClick={onPrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <button type="button" className={styles.navBtn} onClick={onNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {weekDays.map(d => (
                        <div className={styles.dayLabel} key={d}>{d}</div>
                    ))}

                    {dateList.map((dayItem, i) => {
                        const isSelected = selectedDate ? isSameDay(dayItem, new Date(selectedDate)) : false;
                        const isOutside = !isSameMonth(dayItem, monthStart);
                        const today = startOfDay(new Date());
                        const isPast = isBefore(dayItem, today);

                        return (
                            <div
                                key={i}
                                className={`${styles.dayBtn} ${isSelected ? styles.selected : ''} ${isOutside ? styles.outside : ''} ${isPast ? styles.disabled : ''}`}
                                onClick={() => !isPast && handleDateClick(dayItem)}
                            >
                                {format(dayItem, 'd')}
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footer} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={styles.linkBtn} onClick={handleToday}>
                        {todayLabel}
                    </button>
                </div>
            </div>
        </div>
        , document.body);
};
