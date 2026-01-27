import React, { useState, useMemo } from 'react';
import { X, Trash2, Sparkles, Loader2, Plus, ChevronLeft, Check, AlignLeft, Image as ImageIcon, RefreshCcw, Search, ScanLine, Calendar as CalendarIcon, Tag, Wallet, Users, Pin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAppStore } from '../services/store';
import { Category, SplitType, CurrencyCode, Expense } from '../types';
import { Button } from './Button';
import { getCategorySuggestion, parseReceiptImage } from '../services/ai';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants';

interface AddExpenseProps {
  onClose: () => void;
  initialExpense?: Expense;
}

export const AddExpense: React.FC<AddExpenseProps> = ({ onClose, initialExpense }) => {
  const {
    currentUser,
    activeLedgerMembers,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    activeLedgerId,
    baseCurrency,
    categories,
    showConfirm,
    togglePinExpense,
    t
  } = useAppStore();

  // Initialize form state
  const [amount, setAmount] = useState(initialExpense ? initialExpense.amount.toString() : '');
  const [currency, setCurrency] = useState<CurrencyCode>(initialExpense ? initialExpense.currency : baseCurrency);
  const [description, setDescription] = useState<string>(initialExpense ? initialExpense.description : '');

  // Additional fields
  const [notes, setNotes] = useState(initialExpense?.notes || '');
  const [receiptImage, setReceiptImage] = useState(initialExpense?.receiptImage || '');
  const [tags, setTags] = useState<string[]>(initialExpense?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Find category object
  const initialCategory = initialExpense
    ? categories.find(c => c.id === initialExpense.categoryId) || categories[0]
    : categories[0];
  const [category, setCategory] = useState<Category>(initialCategory);

  const [paidBy, setPaidBy] = useState<string>(initialExpense ? initialExpense.paidBy : currentUser.id);
  const [splitType, setSplitType] = useState<SplitType>(initialExpense ? initialExpense.splitType : 'equal');
  const [beneficiaryId, setBeneficiaryId] = useState<string>(initialExpense?.beneficiaryId || activeLedgerMembers.find(m => m.id !== currentUser.id)?.id || currentUser.id);

  // Split Details State (Percentage or Amount)
  const [splitValues, setSplitValues] = useState<Record<string, string>>(() => {
    if (initialExpense && initialExpense.splits) {
      const strSplits: Record<string, string> = {};
      Object.entries(initialExpense.splits).forEach(([k, v]) => {
        strSplits[k] = v.toString();
      });
      return strSplits;
    }
    return {};
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // New Category State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0]);
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_COLORS[0]);
  const [iconSearch, setIconSearch] = useState('');

  // Icon Library Memoization
  const allIcons = useMemo(() => Object.keys(LucideIcons).filter(k => k !== 'createLucideIcon' && k !== 'icons' && isNaN(Number(k))), []);

  const displayedIcons = useMemo(() => {
    if (!iconSearch.trim()) return AVAILABLE_ICONS;
    const searchLower = iconSearch.toLowerCase();
    return allIcons.filter(name => name.toLowerCase().includes(searchLower)).slice(0, 100);
  }, [iconSearch, allIcons]);

  const formatDateForInput = (isoDate: string) => {
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year} -${month} -${day} `;
  };
  const [date, setDate] = useState(initialExpense ? formatDateForInput(initialExpense.date) : formatDateForInput(new Date().toISOString()));

  const [splitError, setSplitError] = useState<string | null>(null);

  const currencies: CurrencyCode[] = ['TWD', 'USD', 'JPY', 'EUR', 'KRW'];

  const handleDistribute = (type: SplitType = splitType) => {
    const count = activeLedgerMembers.length;
    if (count === 0) return;

    if (type === 'percentage') {
      const baseVal = Math.floor((100 / count) * 10) / 10;
      const remainder = 100 - (baseVal * count);
      const newSplits: Record<string, string> = {};
      activeLedgerMembers.forEach((m, index) => {
        let val = baseVal;
        if (index === 0) val = parseFloat((baseVal + remainder).toFixed(1));
        newSplits[m.id] = val.toString();
      });
      setSplitValues(newSplits);
      setSplitError(null);
    } else if (type === 'amount') {
      if (amount) {
        const total = parseFloat(amount);
        const baseVal = Math.floor((total / count) * 100) / 100;
        const remainder = total - (baseVal * count);
        const newSplits: Record<string, string> = {};
        activeLedgerMembers.forEach((m, index) => {
          let val = baseVal;
          if (index === 0) val = parseFloat((baseVal + remainder).toFixed(2));
          newSplits[m.id] = val.toString();
        });
        setSplitValues(newSplits);
        setSplitError(null);
      } else {
        setSplitValues({});
      }
    }
  };

  const handleSplitTypeSelect = (type: SplitType) => {
    setSplitType(type);
    setSplitError(null);
    if (type === 'percentage' || type === 'amount') {
      handleDistribute(type);
    }
  };

  const validateSplits = (): boolean => {
    setSplitError(null);
    if (splitType === 'percentage') {
      let sum = 0;
      activeLedgerMembers.forEach(m => sum += parseFloat(splitValues[m.id] || '0'));
      if (Math.abs(sum - 100) > 0.5) {
        setSplitError(t('validationPercentage'));
        return false;
      }
    } else if (splitType === 'amount') {
      let sum = 0;
      const totalAmount = parseFloat(amount || '0');
      activeLedgerMembers.forEach(m => sum += parseFloat(splitValues[m.id] || '0'));
      if (Math.abs(sum - totalAmount) > 0.1) {
        setSplitError(t('validationAmount'));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    if (!validateSplits()) return;

    const finalSplits: Record<string, number> = {};
    if (splitType === 'percentage' || splitType === 'amount') {
      activeLedgerMembers.forEach(m => finalSplits[m.id] = parseFloat(splitValues[m.id] || '0'));
    }

    const [y, m, d] = date.split('-').map(Number);
    let finalDate = new Date();

    if (initialExpense) {
      const oldDate = new Date(initialExpense.date);
      finalDate = new Date(y, m - 1, d, oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
    } else {
      const now = new Date();
      finalDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    }

    const expenseData = {
      ledgerId: initialExpense ? initialExpense.ledgerId : activeLedgerId,
      amount: parseFloat(amount),
      currency,
      description,
      categoryId: category.id,
      paidBy,
      beneficiaryId: splitType === 'full_for_partner' ? beneficiaryId : undefined,
      date: finalDate.toISOString(),
      splitType,
      isSettlement: initialExpense?.isSettlement,
      notes: notes.trim() || undefined,
      receiptImage: receiptImage || undefined,
      splits: (splitType === 'percentage' || splitType === 'amount') ? finalSplits : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (initialExpense) {
      updateExpense({ ...expenseData, id: initialExpense.id });
    } else {
      addExpense(expenseData);
    }
    onClose();
  };

  const handleCreateCategory = async () => {
    if (newCatName.trim()) {
      const id = await addCategory({ name: newCatName, icon: newCatIcon, color: newCatColor });
      if (id) {
        setCategory({ id: id, name: newCatName, icon: newCatIcon, color: newCatColor });
      }
      setNewCatName('');
      setNewCatIcon(AVAILABLE_ICONS[0]);
      setIsCreatingCategory(false);
      setIconSearch('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsOcrLoading(true);
      const reader = new FileReader();

      reader.onloadend = async () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setReceiptImage(result);
          const translatedCategories = categories.map(c => ({ ...c, name: t(c.name) }));
          const ocrResult = await parseReceiptImage(result, translatedCategories, baseCurrency);

          if (ocrResult) {
            if (typeof ocrResult.amount === 'number') setAmount(ocrResult.amount.toString());
            if (typeof ocrResult.currency === 'string') setCurrency(ocrResult.currency as CurrencyCode);
            if (typeof ocrResult.date === 'string') setDate(ocrResult.date);
            if (typeof ocrResult.description === 'string') setDescription(ocrResult.description);
            if (typeof ocrResult.categoryId === 'string') {
              const matchedCat = categories.find(c => c.id === ocrResult.categoryId);
              if (matchedCat) setCategory(matchedCat);
            }
          }
          setIsOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    if (initialExpense) {
      showConfirm(t('delete'), t('confirmDelete'), () => { deleteExpense(initialExpense.id); onClose(); }, true);
    }
  };

  const handleAiSuggest = async () => {
    if (!description) return;
    setIsAiLoading(true);
    const translatedCategories = categories.map(c => ({ ...c, name: t(c.name) }));
    const suggestedId = await getCategorySuggestion(description, translatedCategories);
    setIsAiLoading(false);
    if (suggestedId) {
      const suggestedCategory = categories.find(c => c.id === suggestedId);
      if (suggestedCategory) setCategory(suggestedCategory);
    }
  };

  const handleSplitValueChange = (userId: string, val: string) => {
    setSplitValues(prev => ({ ...prev, [userId]: val }));
    setSplitError(null);
  };

  const SplitOption = ({ type, label, active }: { type: SplitType, label: string, active: boolean }) => (
    <button
      type="button"
      onClick={() => handleSplitTypeSelect(type)}
      className={`py - 3 px - 2 text - xs font - bold rounded - xl border transition - all whitespace - nowrap flex - 1 ${active
        ? 'bg-stone-800 text-white border-stone-800 shadow-md dark:bg-stone-100 dark:text-stone-900'
        : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 dark:hover:bg-stone-700'
        } `}
    >
      {label}
    </button>
  );

  const getRemaining = () => {
    const total = splitType === 'percentage' ? 100 : parseFloat(amount || '0');
    let currentSum = 0;
    Object.values(splitValues).forEach(v => currentSum += parseFloat(v || '0'));
    return (total - currentSum).toFixed(splitType === 'percentage' ? 1 : 2);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Container: Mobile (Full height) vs Desktop (Large Split View) */}
      <div className="bg-milk-50 dark:bg-stone-950 w-full max-w-md md:max-w-5xl h-[92vh] md:h-[85vh] sm:rounded-3xl rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0 z-10">
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            {isCreatingCategory ? t('createCategory') : (initialExpense ? t('editExpense') : t('newExpense'))}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreatingCategory && initialExpense && (
              <>
                <button
                  type="button"
                  onClick={() => togglePinExpense(initialExpense.id)}
                  className={`p-2 rounded-full transition-colors ${initialExpense.isPinned
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700'
                    }`}
                  title={initialExpense.isPinned ? t('unpinExpense') : t('pinExpense')}
                >
                  <Pin size={20} className={initialExpense.isPinned ? 'fill-current' : ''} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                  title={t('deleted')}
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Main Content Area */}
          {!isCreatingCategory ? (
            <>
              {/* LEFT COLUMN: Details (Scrollable) */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-white dark:bg-stone-950">

                {/* Amount Input */}
                <div className="text-center space-y-2 py-4">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('amount')}</label>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        className="appearance-none bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold rounded-xl pl-3 pr-8 py-2 text-sm border-none focus:ring-0 cursor-pointer"
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    </div>

                    <div className="relative inline-block w-48">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus={!initialExpense}
                        className="w-full text-center text-5xl md:text-6xl font-extrabold bg-transparent text-stone-800 dark:text-white focus:outline-none placeholder-stone-200 dark:placeholder-stone-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Title & Date (Row on Desktop) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                        <AlignLeft size={12} /> {t('title')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="What is it for?"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-milk-50 dark:bg-stone-900 rounded-xl pl-4 pr-10 py-3 font-semibold text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 border border-stone-100 dark:border-stone-800"
                        />
                        <button
                          type="button"
                          onClick={handleAiSuggest}
                          disabled={isAiLoading || !description}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-purple-500 disabled:opacity-30 transition-colors rounded-lg hover:bg-purple-50"
                          title={t('aiSuggest')}
                        >
                          {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                        <CalendarIcon size={12} /> {t('date')}
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-milk-50 dark:bg-stone-900 rounded-xl px-4 py-3 font-semibold text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 border border-stone-100 dark:border-stone-800"
                      />
                      {/* Quick Date Buttons */}
                      <div className="flex gap-2 mt-2">
                        {[
                          { label: t('today'), offset: 0 },
                          { label: t('yesterday'), offset: 1 },
                          { label: t('dayBeforeYesterday'), offset: 2 },
                        ].map(({ label, offset }) => {
                          const d = new Date();
                          d.setDate(d.getDate() - offset);
                          const val = formatDateForInput(d.toISOString());
                          return (
                            <button
                              key={offset}
                              type="button"
                              onClick={() => setDate(val)}
                              className={`flex - 1 py - 1.5 px - 2 text - [10px] font - bold rounded - lg border transition - all ${date === val
                                ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-100 dark:text-stone-900'
                                : 'bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                                } `}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                      <Tag size={12} /> {t('category')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat: Category) => {
                        const Icon = (LucideIcons as any)[cat.icon] || (LucideIcons as any).CircleHelp;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px - 3 py - 2 rounded - xl text - xs font - bold transition - all border flex items - center gap - 1.5 ${category.id === cat.id
                              ? `${cat.color} border-current ring-2 ring-stone-100 dark:ring-stone-800`
                              : 'bg-milk-50 dark:bg-stone-900 text-stone-500 border-stone-100 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                              } `}
                          >
                            {Icon ? <Icon size={14} /> : null}
                            {t(cat.name)}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(true)}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all border bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-200 hover:border-stone-300 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        {t('add')}
                      </button>
                    </div>
                  </div>

                  {/* Notes & Receipt Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-400 ml-1">{t('notes')}</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add details..."
                        rows={3}
                        className="w-full bg-milk-50 dark:bg-stone-900 rounded-xl px-4 py-3 font-medium text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 resize-none border border-stone-100 dark:border-stone-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                        <ScanLine size={12} /> {t('receipt')}
                      </label>

                      {!receiptImage ? (
                        <label className={`flex flex - col items - center justify - center w - full h - [98px] bg - milk - 50 dark: bg - stone - 900 border - 2 border - dashed border - stone - 200 dark: border - stone - 800 rounded - xl cursor - pointer hover: bg - stone - 100 dark: hover: bg - stone - 800 transition - colors relative ${isOcrLoading ? 'opacity-50 pointer-events-none' : ''} `}>
                          <div className="flex flex-col items-center justify-center">
                            {isOcrLoading ? (
                              <Loader2 size={24} className="text-stone-400 animate-spin mb-1" />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full mb-1">
                                  <Sparkles size={10} /> AI Scan
                                </div>
                                <p className="text-[10px] font-bold text-stone-400">{t('addReceipt')}</p>
                              </div>
                            )}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      ) : (
                        <div className="relative w-full h-[98px] bg-black/5 rounded-xl overflow-hidden group border border-stone-100 dark:border-stone-800">
                          <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-start justify-end p-2">
                            <button
                              type="button"
                              onClick={() => setReceiptImage('')}
                              className="bg-white/90 text-stone-600 p-1.5 rounded-full shadow-sm hover:bg-white hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                      <Tag size={12} /> {t('tags')}
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-milk-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-lg"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                            e.preventDefault();
                            const newTag = tagInput.trim().replace(/^#/, '');
                            if (newTag && !tags.includes(newTag)) {
                              setTags([...tags, newTag]);
                            }
                            setTagInput('');
                          }
                        }}
                        placeholder={tags.length === 0 ? t('addTag') : ''}
                        className="flex-1 min-w-[100px] bg-transparent text-sm font-medium text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
                      />
                    </div>
                    {/* Popular Tags Suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {['固定支出', '可省', '必要', '娛樂', '出差'].filter(t => !tags.includes(t)).slice(0, 4).map(suggestedTag => (
                        <button
                          key={suggestedTag}
                          type="button"
                          onClick={() => setTags([...tags, suggestedTag])}
                          className="px-2 py-0.5 text-[10px] font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                          +{suggestedTag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Logic (Scrollable) - Desktop Only distinct visual */}
              <div className="w-full md:w-[380px] bg-stone-50 dark:bg-stone-900/50 border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-800 overflow-y-auto no-scrollbar p-6 space-y-6 flex flex-col">

                {/* Who Paid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                    <Wallet size={12} /> {t('whoPaid')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeLedgerMembers.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setPaidBy(member.id)}
                        className={`flex items - center justify - center gap - 2 py - 3 px - 3 rounded - xl text - sm font - bold transition - all ${paidBy === member.id
                          ? 'bg-white dark:bg-stone-800 border-2 border-stone-800 dark:border-stone-100 text-stone-800 dark:text-white shadow-sm'
                          : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500'
                          } `}
                      >
                        <div className={`w - 2 h - 2 rounded - full ${member.color.replace('text-', 'bg-').split(' ')[0]} `}></div>
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* How to Split */}
                <div className="space-y-3 flex-1">
                  <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                    <Users size={12} /> {t('howSplit')}
                  </label>
                  <div className="flex gap-2 p-1 bg-stone-200/50 dark:bg-stone-800 rounded-xl overflow-x-auto no-scrollbar">
                    <SplitOption type="equal" label={t('everyone')} active={splitType === 'equal'} />
                    <SplitOption
                      type="full_for_partner"
                      label={t('for')}
                      active={splitType === 'full_for_partner'}
                    />
                    <SplitOption type="percentage" label="%" active={splitType === 'percentage'} />
                    <SplitOption type="amount" label="$" active={splitType === 'amount'} />
                  </div>

                  {/* Beneficiary Selector */}
                  {splitType === 'full_for_partner' && (
                    <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 animate-in fade-in slide-in-from-top-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">{t('for')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {activeLedgerMembers.map(member => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setBeneficiaryId(member.id)}
                            className={`px - 4 py - 2 rounded - lg text - xs font - bold border transition - all ${beneficiaryId === member.id
                              ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-100 dark:text-stone-900'
                              : 'bg-stone-50 dark:bg-stone-900 text-stone-500 border-stone-200 dark:border-stone-700'
                              } `}
                          >
                            {member.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advanced Split Inputs */}
                  {(splitType === 'percentage' || splitType === 'amount') && (
                    <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 animate-in fade-in slide-in-from-top-1 space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('splitDetails')}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text - [10px] font - bold ${splitError ? 'text-red-500' : 'text-stone-400'} `}>
                            {splitError ? splitError : `${t('remaining')}: ${getRemaining()} `}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDistribute(splitType)}
                            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 bg-stone-100 dark:bg-stone-700 p-1.5 rounded-md"
                            title={t('distribute')}
                          >
                            <RefreshCcw size={12} />
                          </button>
                        </div>
                      </div>
                      {activeLedgerMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <span className="text-sm font-bold text-stone-600 dark:text-stone-300 w-24 truncate">{member.name}</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              placeholder="0"
                              value={splitValues[member.id] || ''}
                              onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                              className="w-24 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg py-2 px-3 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200"
                            />
                            <span className="text-xs font-bold text-stone-400 w-4">
                              {splitType === 'percentage' ? '%' : currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button Block (Stays at bottom of Right Col on desktop) */}
                <div className="mt-auto pt-4 border-t border-stone-200 dark:border-stone-800/50">
                  <Button
                    onClick={handleSubmit}
                    className="w-full shadow-lg shadow-stone-300/50 dark:shadow-none dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white py-4 text-base"
                    size="lg"
                    disabled={!amount || !description || isOcrLoading}
                  >
                    {isOcrLoading ? t('analyzingReceipt') : (initialExpense ? t('updateExpense') : t('saveExpense'))}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Category Creation View (Takes full width) */
            <div className="w-full p-6 space-y-6 bg-white dark:bg-stone-950 animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <ChevronLeft size={24} className="text-stone-500" />
                </button>
                <span className="text-lg font-bold text-stone-800 dark:text-stone-100">{t('createCategory')}</span>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 ml-1">{t('categoryName')}</label>
                  <input
                    type="text"
                    autoFocus
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Gym"
                    className="w-full bg-milk-50 dark:bg-stone-900 rounded-xl px-4 py-3 font-semibold text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 border border-stone-200 dark:border-stone-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 ml-1 flex justify-between">
                    {t('selectIcon')}
                    <span className="text-stone-300 dark:text-stone-600 font-normal">{newCatIcon}</span>
                  </label>

                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Search icons..."
                      className="w-full bg-stone-50 dark:bg-stone-900 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-stone-400"
                    />
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto no-scrollbar p-1">
                    {displayedIcons.map(iconName => {
                      const Icon = (LucideIcons as any)[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewCatIcon(iconName)}
                          title={iconName}
                          className={`p - 2 rounded - xl flex items - center justify - center transition - all aspect - square ${newCatIcon === iconName
                            ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-md'
                            : 'bg-milk-50 dark:bg-stone-900 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200'
                            } `}
                        >
                          {Icon ? <Icon size={20} /> : <div className="w-5 h-5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 ml-1">{t('selectColor')}</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_COLORS.map(colorClass => (
                      <button
                        key={colorClass}
                        type="button"
                        onClick={() => setNewCatColor(colorClass)}
                        className={`h - 10 rounded - xl transition - all relative ${colorClass} ${newCatColor === colorClass ? 'ring-2 ring-stone-800 dark:ring-white ring-offset-2 dark:ring-offset-stone-900' : 'opacity-70 hover:opacity-100'
                          } `}
                      >
                        {newCatColor === colorClass && <Check size={14} className="absolute inset-0 m-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleCreateCategory}
                    className="w-full"
                    size="lg"
                    disabled={!newCatName.trim()}
                  >
                    {t('createCategory')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};