import React, { useState, useMemo } from 'react';
import { useAppStore } from '../services/store';
import { Moon, Sun, Globe, Coins, Layers, Plus, Check, Users, X, RefreshCw, TrendingUp, Edit3, Trash2, Search, FileDown, Target } from 'lucide-react';
import { CurrencyCode, Category } from '../types';
import { Language } from '../locales';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants';
import * as Icons from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    darkMode, toggleDarkMode, 
    language, setLanguage, 
    baseCurrency, setBaseCurrency,
    categories, addCategory, updateCategory, deleteCategory,
    users, addUser, deleteUser,
    rates, refreshRates,
    monthlyBudget, setMonthlyBudget,
    exportData,
    showConfirm, t 
  } = useAppStore();

  const currencies: CurrencyCode[] = ['TWD', 'USD', 'JPY', 'EUR', 'KRW'];
  
  // Category State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Form State (Shared for Add/Edit)
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState(AVAILABLE_ICONS[0]);
  const [catColor, setCatColor] = useState(AVAILABLE_COLORS[0]);
  const [iconSearch, setIconSearch] = useState('');

  // User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserColor, setNewUserColor] = useState(AVAILABLE_COLORS[0]);
  
  // Rate Loading State
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Icon Library Memoization
  const allIcons = useMemo(() => Object.keys(Icons).filter(k => k !== 'createLucideIcon' && k !== 'icons' && isNaN(Number(k))), []);

  const displayedIcons = useMemo(() => {
    if (!iconSearch.trim()) return AVAILABLE_ICONS;
    
    const searchLower = iconSearch.toLowerCase();
    return allIcons.filter(name => name.toLowerCase().includes(searchLower)).slice(0, 100); // Limit results for performance
  }, [iconSearch, allIcons]);

  const handleRefreshRates = async () => {
    setIsLoadingRates(true);
    await refreshRates();
    setIsLoadingRates(false);
  };

  const resetCategoryForm = () => {
    setCatName('');
    setCatIcon(AVAILABLE_ICONS[0]);
    setCatColor(AVAILABLE_COLORS[0]);
    setEditingCategory(null);
    setIsAddingCategory(false);
    setIconSearch('');
  };

  const startAddCategory = () => {
    resetCategoryForm();
    setIsAddingCategory(true);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCatName(t(category.name)); // Translate default categories when editing to show localized string
    setCatIcon(category.icon);
    setCatColor(category.color);
    setIsAddingCategory(true); // Re-use the modal/form area
    setIconSearch('');
  };

  const handleSaveCategory = () => {
    if (catName.trim()) {
      if (editingCategory) {
        updateCategory(editingCategory.id, {
          name: catName,
          icon: catIcon,
          color: catColor
        });
      } else {
        addCategory({
          name: catName,
          icon: catIcon,
          color: catColor
        });
      }
      resetCategoryForm();
    }
  };

  const handleDeleteCategory = (id: string) => {
     showConfirm(
       t('delete'),
       t('confirmDelete'),
       () => {
         deleteCategory(id);
         if (editingCategory?.id === id) resetCategoryForm();
       },
       true
     );
  };

  const handleAddUser = () => {
    if (newUserName.trim()) {
      addUser(newUserName, newUserColor);
      setNewUserName('');
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    showConfirm(
      t('confirmDelete'),
      t('confirmDeleteUser'),
      () => deleteUser(id),
      true // Destructive action
    );
  };

  return (
    <div className="p-6 pt-10 pb-24 h-full overflow-y-auto no-scrollbar">
      <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-8">{t('appSettings')}</h2>

      <div className="space-y-6">
        
        {/* Appearance Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <span className="font-bold text-stone-700 dark:text-stone-200">{t('darkMode')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-800"></div>
            </label>
          </div>
        </div>

        {/* Language Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              <Globe size={20} />
            </div>
            <span className="font-bold text-stone-700 dark:text-stone-200">{t('language')}</span>
          </div>
          <div className="flex bg-milk-100 dark:bg-stone-800 p-1 rounded-xl">
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${language === 'en' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-400'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage('zh')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${language === 'zh' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-400'}`}
            >
              繁體中文
            </button>
          </div>
        </div>

        {/* Monthly Budget Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
           <div className="flex items-center space-x-3 mb-3">
             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
               <Target size={20} />
             </div>
             <span className="font-bold text-stone-700 dark:text-stone-200">{t('monthlyBudget')}</span>
           </div>
           <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">{baseCurrency}</span>
                 <input 
                   type="number"
                   value={monthlyBudget}
                   onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                   className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl pl-16 pr-4 py-3 font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700"
                 />
              </div>
           </div>
        </div>

        {/* Export Data */}
        <button 
          onClick={exportData}
          className="w-full bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 flex items-center justify-between group hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:bg-indigo-200 transition-colors">
               <FileDown size={20} />
             </div>
             <span className="font-bold text-stone-700 dark:text-stone-200">{t('exportData')}</span>
          </div>
        </button>

        {/* Currency Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-3 mb-3">
             <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
               <Coins size={20} />
             </div>
             <span className="font-bold text-stone-700 dark:text-stone-200">{t('baseCurrency')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {currencies.map(c => (
              <button
                key={c}
                onClick={() => setBaseCurrency(c)}
                className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                  baseCurrency === c 
                    ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-100 dark:text-stone-900' 
                    : 'bg-transparent text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Exchange Rates Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full">
                 <TrendingUp size={20} />
               </div>
               <span className="font-bold text-stone-700 dark:text-stone-200">{t('exchangeRates')}</span>
             </div>
             <button 
                onClick={handleRefreshRates}
                disabled={isLoadingRates}
                className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                title={t('refresh')}
              >
                <RefreshCw size={16} className={isLoadingRates ? 'animate-spin' : ''} />
              </button>
          </div>
          
          <div className="space-y-2">
            {currencies
              .filter(c => c !== baseCurrency)
              .map(targetCurrency => {
                const rateBase = rates[baseCurrency] || 1;
                const rateTarget = rates[targetCurrency] || 1;
                const displayRate = rateTarget / rateBase;

                return (
                  <div key={targetCurrency} className="flex justify-between items-center py-2 px-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-500 text-xs">1 {baseCurrency}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-stone-700 dark:text-stone-300 text-sm">≈ {displayRate.toFixed(4)}</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{targetCurrency}</span>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>

        {/* Manage Users */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                 <Users size={20} />
               </div>
               <span className="font-bold text-stone-700 dark:text-stone-200">{t('manageUsers')}</span>
             </div>
             {!isAddingUser && (
                <button 
                  onClick={() => setIsAddingUser(true)}
                  className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700"
                >
                  <Plus size={18} />
                </button>
             )}
          </div>

          {isAddingUser ? (
             <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 border border-stone-100 dark:border-stone-800">
               <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1">{t('userName')}</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 rounded-lg px-3 py-2 text-sm font-bold text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Charlie"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1">{t('selectColor')}</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_COLORS.map(colorClass => (
                    <button
                      key={colorClass}
                      onClick={() => setNewUserColor(colorClass)}
                      className={`h-8 rounded-lg transition-all relative ${colorClass} ${
                        newUserColor === colorClass ? 'ring-2 ring-stone-800 dark:ring-white ring-offset-2 dark:ring-offset-stone-900' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {newUserColor === colorClass && <Check size={12} className="absolute inset-0 m-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleAddUser}
                  disabled={!newUserName.trim()}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md disabled:opacity-50"
                >
                  {t('createUser')}
                </button>
              </div>
             </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <div 
                  key={u.id}
                  className={`group relative pr-7 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 ${u.color} border-current opacity-90`}
                >
                  <div className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[8px] overflow-hidden">
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  {u.name}
                  <button 
                     onClick={() => handleDeleteUser(u.id)}
                     className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                     title="Delete"
                   >
                     <X size={12} />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage Categories */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                 <Layers size={20} />
               </div>
               <span className="font-bold text-stone-700 dark:text-stone-200">{t('manageCategories')}</span>
             </div>
             {!isAddingCategory && (
                <button 
                  onClick={startAddCategory}
                  className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700"
                >
                  <Plus size={18} />
                </button>
             )}
          </div>

          {isAddingCategory ? (
            <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">{editingCategory ? t('category') : t('createCategory')}</h4>
                {editingCategory && (
                  <button onClick={() => handleDeleteCategory(editingCategory.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1">{t('categoryName')}</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 rounded-lg px-3 py-2 text-sm font-bold text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Gym"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1 flex justify-between">
                  {t('selectIcon')}
                  <span className="text-stone-300 dark:text-stone-600 font-normal">{catIcon}</span>
                </label>
                
                {/* Icon Search */}
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons..."
                    className="w-full bg-white dark:bg-stone-900 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                  {displayedIcons.map(iconName => {
                    const Icon = (Icons as any)[iconName];
                    return (
                      <button
                        key={iconName}
                        onClick={() => setCatIcon(iconName)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all aspect-square ${
                          catIcon === iconName
                            ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-md'
                            : 'bg-white dark:bg-stone-900 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                        }`}
                        title={iconName}
                      >
                        {Icon ? <Icon size={20} /> : <div className="w-5 h-5 bg-red-200" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1">{t('selectColor')}</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_COLORS.map(colorClass => (
                    <button
                      key={colorClass}
                      onClick={() => setCatColor(colorClass)}
                      className={`h-8 rounded-lg transition-all relative ${colorClass} ${
                        catColor === colorClass ? 'ring-2 ring-stone-800 dark:ring-white ring-offset-2 dark:ring-offset-stone-900' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {catColor === colorClass && <Check size={12} className="absolute inset-0 m-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={resetCategoryForm}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleSaveCategory}
                  disabled={!catName.trim()}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md disabled:opacity-50"
                >
                  {editingCategory ? t('save') : t('createCategory')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => startEditCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 ${cat.color} border-current opacity-90 hover:opacity-100 transition-opacity`}
                >
                   {React.createElement((Icons as any)[cat.icon] || Icons.HelpCircle, { size: 14 })}
                   {t(cat.name)}
                   <div className="w-4 h-4 rounded-full bg-black/5 flex items-center justify-center ml-1">
                     <Edit3 size={8} className="opacity-50" />
                   </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
