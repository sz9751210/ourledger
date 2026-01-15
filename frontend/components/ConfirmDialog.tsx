import React from 'react';
import { useAppStore } from '../services/store';

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, hideConfirm, t } = useAppStore();

  if (!confirmDialog.isOpen) return null;

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    hideConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={hideConfirm}
      ></div>
      
      {/* Modal */}
      <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-stone-100 dark:border-stone-800">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
          {confirmDialog.title}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
          {confirmDialog.message}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={hideConfirm}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-colors ${
              confirmDialog.isDestructive 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none' 
                : 'bg-stone-800 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-900'
            }`}
          >
            {confirmDialog.isDestructive ? t('delete') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};