import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { useAppStore } from '../services/store';

export const QuickStatsWidget: React.FC = () => {
    const { activeLedgerId, getLedgerExpenses, baseCurrency, convertAmount, t } = useAppStore();
    const expenses = getLedgerExpenses(activeLedgerId);

    const { thisWeekTotal, lastWeekTotal, percentChange, trend } = useMemo(() => {
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday of this week
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

        let thisWeek = 0;
        let lastWeek = 0;

        expenses
            .filter(e => !e.isSettlement)
            .forEach(expense => {
                const expenseDate = new Date(expense.date);
                const amount = convertAmount(expense.amount, expense.currency, baseCurrency);

                if (expenseDate >= startOfThisWeek) {
                    thisWeek += amount;
                } else if (expenseDate >= startOfLastWeek && expenseDate < startOfThisWeek) {
                    lastWeek += amount;
                }
            });

        let change = 0;
        let trendDir: 'up' | 'down' | 'neutral' = 'neutral';

        if (lastWeek > 0) {
            change = ((thisWeek - lastWeek) / lastWeek) * 100;
            trendDir = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';
        } else if (thisWeek > 0) {
            trendDir = 'up';
            change = 100;
        }

        return {
            thisWeekTotal: thisWeek,
            lastWeekTotal: lastWeek,
            percentChange: Math.abs(change).toFixed(0),
            trend: trendDir,
        };
    }, [expenses, baseCurrency, convertAmount]);

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-emerald-500' : 'text-stone-400';
    const trendBg = trend === 'up' ? 'bg-red-50 dark:bg-red-900/20' : trend === 'down' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-stone-100 dark:bg-stone-800';

    if (expenses.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 dark:from-stone-100 dark:to-stone-200 rounded-2xl p-4 shadow-lg mb-6 flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                    <Activity size={12} />
                    {t('thisWeek')}
                </div>
                <p className="text-2xl font-extrabold text-white dark:text-stone-900">
                    {baseCurrency} {thisWeekTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trendBg}`}>
                <TrendIcon size={14} className={trendColor} />
                <span className={`text-xs font-bold ${trendColor}`}>
                    {percentChange}%
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-1 hidden sm:inline">
                    {t('vsLastWeek')}
                </span>
            </div>
        </div>
    );
};
