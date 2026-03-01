"use client";

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

import {
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type TransactionType,
} from "@/lib/validators/expense";

export type Expense = {
  id: string;
  title: string;
  category: string;
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string | null;
  savingsLocation?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseFilters = {
  category?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  search?: string;
};

export type ExpenseSummary = {
  income: number;
  expense: number;
  savings: number;
  received: number;
  net: number;
};

export type TrendPoint = {
  label: string;
  income: number;
  expense: number;
};

export type CategorySlice = {
  name: string;
  value: number;
};

export type SavingsLocation = {
  location: string;
  value: number;
};

type ExpenseState = {
  expenses: Expense[];
  recent: Expense[];
  summary: ExpenseSummary;
  trend: TrendPoint[];
  categoryBreakdown: CategorySlice[];
  savingsByLocation: SavingsLocation[];
  allCategories: string[];
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  lastSyncedAt: string | null;
  setFilters: (filters: Partial<ExpenseFilters>) => Promise<void>;
  resetFilters: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setPageSize: (size: number) => Promise<void>;
  fetchExpenses: () => Promise<void>;
  createExpense: (payload: CreateExpenseInput) => Promise<Expense | null>;
  updateExpense: (id: string, payload: UpdateExpenseInput) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
};

type PersistedExpenseState = Pick<
  ExpenseState,
  "filters" | "page" | "pageSize"
>;

const storage =
  typeof window !== "undefined"
    ? createJSONStorage<PersistedExpenseState>(() => window.localStorage)
    : undefined;

const buildQueryParams = (state: Pick<ExpenseState, "filters" | "page" | "pageSize">) => {
  const params = new URLSearchParams();
  if (state.filters.category) params.set("category", state.filters.category);
  if (state.filters.type) params.set("type", state.filters.type);
  if (state.filters.from) params.set("from", state.filters.from);
  if (state.filters.to) params.set("to", state.filters.to);
  if (state.filters.search) params.set("search", state.filters.search);
  params.set("page", state.page.toString());
  params.set("pageSize", state.pageSize.toString());
  return params.toString();
};

const parseApiError = async (response: Response) => {
  try {
    const data = await response.json();
    return (data?.error as string) ?? response.statusText;
  } catch {
    return response.statusText;
  }
};

export const useExpenseStore = create<ExpenseState>()(
  devtools(
    persist(
      (set, get) => ({
        expenses: [],
        recent: [],
        summary: { income: 0, expense: 0, savings: 0, received: 0, net: 0 },
        trend: [],
        categoryBreakdown: [],
        savingsByLocation: [],
        allCategories: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        isLoading: false,
        error: null,
        filters: {},
        lastSyncedAt: null,
        setFilters: async (filters) => {
          set((state) => ({ filters: { ...state.filters, ...filters }, page: 1 }));
          await get().fetchExpenses();
        },
        resetFilters: async () => {
          set({ filters: {}, page: 1 });
          await get().fetchExpenses();
        },
        setPage: async (page) => {
          set({ page });
          await get().fetchExpenses();
        },
        setPageSize: async (size) => {
          set({ pageSize: size, page: 1 });
          await get().fetchExpenses();
        },
        fetchExpenses: async () => {
          set({ isLoading: true, error: null });
          const params = buildQueryParams(get());
          try {
            const response = await fetch(`/api/expenses?${params}`, {
              method: "GET",
              cache: "no-store",
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            const payload = await response.json();
            set({
              expenses: payload?.data ?? [],
              recent: payload?.recent ?? [],
              summary: payload?.summary ?? { income: 0, expense: 0, savings: 0, received: 0, net: 0 },
              trend: payload?.trend ?? [],
              categoryBreakdown: payload?.categoryBreakdown ?? [],
              savingsByLocation: payload?.savingsByLocation ?? [],
              allCategories: payload?.allCategories ?? [],
              totalCount: payload?.meta?.totalCount ?? 0,
              page: payload?.meta?.page ?? get().page,
              pageSize: payload?.meta?.pageSize ?? get().pageSize,
              isLoading: false,
              lastSyncedAt: new Date().toISOString(),
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to load expenses.";
            set({ error: message, isLoading: false });
          }
        },
        createExpense: async (payload) => {
          try {
            const response = await fetch(`/api/expenses`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payload,
                date: payload.date instanceof Date ? payload.date.toISOString() : payload.date,
              }),
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            const { data } = await response.json();
            await get().fetchExpenses();
            return data ?? null;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to create expense.";
            set({ error: message });
            return null;
          }
        },
        updateExpense: async (id, payload) => {
          try {
            const response = await fetch(`/api/expenses/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payload,
                date: payload.date instanceof Date ? payload.date.toISOString() : payload.date,
              }),
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            const { data } = await response.json();
            await get().fetchExpenses();
            return data ?? null;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to update expense.";
            set({ error: message });
            return null;
          }
        },
        deleteExpense: async (id) => {
          try {
            const response = await fetch(`/api/expenses/${id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            set((state) => ({
              expenses: state.expenses.filter((expense) => expense.id !== id),
              lastSyncedAt: new Date().toISOString(),
              error: null,
            }));

            await get().fetchExpenses();
            return true;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to delete expense.";
            set({ error: message });
            return false;
          }
        },
      }),
      {
        name: "expense-storage",
        storage,
        partialize: (state) => ({
          filters: state.filters,
          page: state.page,
          pageSize: state.pageSize,
          lastSyncedAt: state.lastSyncedAt,
        }),
      },
    ),
  ),
);

