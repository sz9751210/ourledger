import React from 'react';
import { useAppStore } from '../services/store';
import { Pin, PinOff, Plus, Bookmark, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';

interface PinnedExpensesProps {
    onUseTemplate: (expense: any) => void;
}

export const PinnedExpenses: React.FC<PinnedExpensesProps> = ({ onUseTemplate }) => {
    const { expenses, categories, togglePinExpense, t } = useAppStore();

    const pinnedExpenses = expenses.filter(e => e.isPinned && !e.isSettlement);

    if (pinnedExpenses.length === 0) {
        return (
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-4 border border-dashed border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-bold mb-2">
                    <Bookmark size={14} />
                    {t('pinnedExpenses')}
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed">
                    {t('longPressToPin')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest">
                    <Bookmark size={12} />
                    {t('pinnedExpenses')}
                </div>
                <span className="text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                    {pinnedExpenses.length}
                </span>
            </div>

            <div className="space-y-2">
                {pinnedExpenses.slice(0, 5).map(expense => {
                    const category = categories.find(c => c.id === expense.categoryId);
                    const Icon = category ? (Icons as any)[category.icon] : Icons.HelpCircle;

                    return (
                        <div
                            key={expense.id}
                            className="group bg-white dark:bg-stone-900 rounded-xl p-3 border border-stone-100 dark:border-stone-800 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                            onClick={() => onUseTemplate(expense)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category?.color || 'bg-gray-100'}`}>
                                    <Icon size={14} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-stone-800 dark:text-stone-100 line-clamp-1">
                                        {expense.description}
                                    </p>
                                    <p className="text-[10px] text-stone-400">
                                        {expense.currency} {expense.amount}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePinExpense(expense.id);
                                    }}
                                    className="p-1.5 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title={t('unpinExpense')}
                                >
                                    <PinOff size={12} />
                                </button>
                                <ChevronRight size={14} className="text-stone-300" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
