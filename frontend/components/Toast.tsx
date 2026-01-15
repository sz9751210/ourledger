import React from 'react';
import { Bell, CheckCircle, Wallet, X } from 'lucide-react';
import { AppNotification } from '../types';
import { useAppStore } from '../services/store';

export const ToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useAppStore();

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] px-4 pointer-events-none flex flex-col items-center space-y-2">
      {notifications.map((note) => (
        <div 
          key={note.id}
          className="pointer-events-auto max-w-sm w-full bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-stone-100 p-4 flex items-start gap-3 animate-in slide-in-from-top-5 duration-300"
        >
          <div className={`p-2 rounded-full shrink-0 ${
            note.type === 'success' ? 'bg-green-100 text-green-600' :
            note.type === 'settlement' ? 'bg-softblue-100 text-softblue-600' :
            'bg-stone-100 text-stone-600'
          }`}>
            {note.type === 'success' && <CheckCircle size={18} />}
            {note.type === 'settlement' && <Wallet size={18} />}
            {note.type === 'info' && <Bell size={18} />}
          </div>
          
          <div className="flex-1 pt-0.5">
            <h4 className="text-sm font-bold text-stone-800 leading-none mb-1">{note.title}</h4>
            <p className="text-xs text-stone-500 leading-relaxed">{note.message}</p>
          </div>

          <button 
            onClick={() => dismissNotification(note.id)}
            className="text-stone-300 hover:text-stone-500 p-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};