"use client";

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

import type { TransactionType } from "@/lib/generated/prisma/enums";
import {
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validators/expense";

export type Expense = {
  id: string;
  title: string;
  category: string;
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string | null;
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

type ExpenseState = {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  lastSyncedAt: string | null;
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  resetFilters: () => void;
  fetchExpenses: () => Promise<void>;
  createExpense: (payload: CreateExpenseInput) => Promise<Expense | null>;
  updateExpense: (id: string, payload: UpdateExpenseInput) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
};

type PersistedExpenseState = Pick<ExpenseState, "expenses" | "filters" | "lastSyncedAt">;

const storage =
  typeof window !== "undefined"
    ? createJSONStorage<PersistedExpenseState>(() => window.localStorage)
    : undefined;

const buildQueryString = (filters: ExpenseFilters) => {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
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
        isLoading: false,
        error: null,
        lastSyncedAt: null,
        filters: {},
        setFilters: (filters) =>
          set((state) => ({ filters: { ...state.filters, ...filters } })),
        resetFilters: () => set({ filters: {} }),
        fetchExpenses: async () => {
          set({ isLoading: true, error: null });
          try {
            const query = buildQueryString(get().filters);
            const response = await fetch(`/api/expenses${query}`, {
              method: "GET",
              cache: "no-store",
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            const payload = await response.json();
            set({
              expenses: payload?.data ?? [],
              isLoading: false,
              lastSyncedAt: new Date().toISOString(),
              error: null,
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
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            const { data } = await response.json();
            if (!data) {
              return null;
            }

            set((state) => ({
              expenses: [data, ...state.expenses],
              lastSyncedAt: new Date().toISOString(),
              error: null,
            }));

            return data;
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
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error(await parseApiError(response));
            }

            const { data } = await response.json();
            if (!data) {
              return null;
            }

            set((state) => ({
              expenses: state.expenses.map((expense) =>
                expense.id === id ? { ...expense, ...data } : expense,
              ),
              lastSyncedAt: new Date().toISOString(),
              error: null,
            }));

            return data;
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
          expenses: state.expenses,
          filters: state.filters,
          lastSyncedAt: state.lastSyncedAt,
        }),
      },
    ),
  ),
);

