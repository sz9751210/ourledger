import axios from 'axios';
import { Expense, Ledger, User, Category } from '../types';

// 設定你的後端網址
const API_URL = import.meta.env.VITE_API_URL || 'http://ledger_server:5050/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 資料轉換 Helper (如果後端回傳 _id，這裡轉為 id，若後端已處理則不需要)
const transformId = (data: any) => {
  if (Array.isArray(data)) {
    return data.map(item => ({ ...item, id: item._id || item.id }));
  }
  if (data && (data._id || data.id)) {
    return { ...data, id: data._id || data.id };
  }
  return data;
};

// Response Interceptor 自動轉換 ID
api.interceptors.response.use(response => {
  response.data = transformId(response.data);
  return response;
});

// --- Users ---
export const getUsers = () => api.get<User[]>('/users');
export const createUser = (data: Partial<User>) => api.post<User>('/users', data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);

// --- Ledgers ---
export const getLedgers = () => api.get<Ledger[]>('/ledgers');
export const createLedger = (data: Partial<Ledger>) => api.post<Ledger>('/ledgers', data);
export const updateLedger = (id: string, data: Partial<Ledger>) => api.patch<Ledger>(`/ledgers/${id}`, data);
export const deleteLedger = (id: string) => api.delete(`/ledgers/${id}`);

// --- Categories ---
export const getCategories = () => api.get<Category[]>('/categories');
export const createCategory = (data: Partial<Category>) => api.post<Category>('/categories', data);
export const updateCategory = (id: string, data: Partial<Category>) => api.patch<Category>(`/categories/${id}`, data);
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`);

// --- Expenses ---
export const getExpenses = (ledgerId: string) => api.get<Expense[]>(`/expenses?ledgerId=${ledgerId}`);
export const createExpense = (data: Partial<Expense>) => api.post<Expense>('/expenses', data);
export const updateExpense = (id: string, data: Partial<Expense>) => api.patch<Expense>(`/expenses/${id}`, data);
export const deleteExpense = (id: string) => api.delete(`/expenses/${id}`);

export default api;