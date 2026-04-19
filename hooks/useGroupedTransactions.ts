// hooks/useGroupedTransactions.ts
// How the transactions are shown in the history page

import { useMemo } from 'react';
import { Transaction } from '../shared/types';
import { Language } from '../translations';

export interface GroupedTransactions {
  title: string;
  key: string;
  transactions: Transaction[];
}

export const useGroupedTransactions = (transactions: Transaction[], t: (path: string, params?: any) => string, language: Language) => {
  return useMemo(() => {
    const groups: GroupedTransactions[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const txDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      let title = '';
      let key = '';

      if (txDay.getTime() === today.getTime()) {
        title = t('history.periods.today');
        key = 'today';
      } else if (txDay.getTime() === yesterday.getTime()) {
        title = t('history.periods.yesterday');
        key = 'yesterday';
      } else if (txDay.getTime() === dayBeforeYesterday.getTime()) {
        title = t('history.periods.day_before_yesterday');
        key = 'day_before_yesterday';
      } else if (txDay >= startOfWeek) {
        title = date.toLocaleDateString(language === 'ht' ? 'ht-HT' : 'fr-HT', { weekday: 'long' });
        title = title.charAt(0).toUpperCase() + title.slice(1);
        key = `weekday-${txDay.getTime()}`;
      } else if (txDay >= lastWeekStart && txDay <= lastWeekEnd) {
        title = t('history.periods.last_week');
        key = 'last-week';
      } else if (txDay.getMonth() === today.getMonth() && txDay.getFullYear() === today.getFullYear()) {
        const weekNum = Math.ceil(date.getDate() / 7);
        const weekDate = new Date(txDay);
        weekDate.setDate(1 + (weekNum - 1) * 7);
        title = t('history.periods.week_of', { date: weekDate.toLocaleDateString(language === 'ht' ? 'ht-HT' : 'fr-HT', { day: 'numeric', month: 'short' }) });
        key = `week-${weekNum}-${txDay.getMonth()}`;
      } else if (txDay.getFullYear() === today.getFullYear()) {
        const monthName = date.toLocaleDateString(language === 'ht' ? 'ht-HT' : 'fr-HT', { month: 'long' });
        title = t('history.periods.month_of', { month: monthName.charAt(0).toUpperCase() + monthName.slice(1) });
        key = `month-${txDay.getMonth()}`;
      } else {
        const monthName = date.toLocaleDateString(language === 'ht' ? 'ht-HT' : 'fr-HT', { month: 'long', year: 'numeric' });
        title = t('history.periods.month_year', { month: monthName.charAt(0).toUpperCase() + monthName.slice(1), year: date.getFullYear() });
        key = `month-year-${txDay.getMonth()}-${txDay.getFullYear()}`;
      }

      const existingGroup = groups.find(g => g.key === key);
      if (existingGroup) {
        existingGroup.transactions.push(tx);
      } else {
        groups.push({ title, key, transactions: [tx] });
      }
    });

    return groups;
  }, [transactions, t, language]);
};
