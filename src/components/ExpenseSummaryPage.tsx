/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Receipt, 
  Tag, 
  Plus, 
  User, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Roommate, Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../utils/calculations';

interface ExpenseSummaryPageProps {
  expenses: Expense[];
  roommates: Roommate[];
  onDeleteExpense: (expenseId: string) => void;
  onNavigate: (page: 'add-expense') => void;
}

export const ExpenseSummaryPage: React.FC<ExpenseSummaryPageProps> = ({
  expenses,
  roommates,
  onDeleteExpense,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Search and filter list
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || exp.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate totals by category for the progress charts
  const categoryTotals: Record<string, number> = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    categoryTotals[cat.name] = 0;
  });
  
  let totalSpent = 0;
  expenses.forEach((exp) => {
    totalSpent += exp.amount;
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += exp.amount;
    } else {
      categoryTotals['Other'] = (categoryTotals['Other'] || 0) + exp.amount;
    }
  });

  // Get percentage of highest category to scale the bars nicely
  const maxCategoryValue = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Header and Add quick button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-slate-800">
            Household Expense Summary
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Analyze category outlays and browse individual receipts.
          </p>
        </div>
        <button
          id="summary-add-btn"
          onClick={() => onNavigate('add-expense')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Add New Expense
        </button>
      </div>

      {/* Grid of details: Interactive category metrics on one side, searchable log on other */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Expenditure charts */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-800">
              Outlays By Category
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Relative weight of shared expenditures. Refer to RM ratios below.
            </p>
          </div>

          <div className="space-y-4">
            {EXPENSE_CATEGORIES.map((cat) => {
              const amount = categoryTotals[cat.name] || 0;
              const pctOfMax = (amount / maxCategoryValue) * 100;
              const pctOfTotal = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

              return (
                <div key={cat.name} className="space-y-1.5" id={`category-chart-row-${cat.name}`}>
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className="font-mono text-slate-500 font-bold">
                      RM {amount.toFixed(2)} <span className="text-[10px] text-slate-400">({pctOfTotal.toFixed(0)}%)</span>
                    </span>
                  </div>
                  {/* CSS bar slider */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.name === 'Rent' 
                          ? 'bg-indigo-500' 
                          : cat.name === 'Groceries' 
                            ? 'bg-emerald-500' 
                            : cat.name === 'Utilities' 
                              ? 'bg-amber-500' 
                              : cat.name === 'Houseware' 
                                ? 'bg-pink-500' 
                                : cat.name === 'Maintenance' 
                                  ? 'bg-sky-500' 
                                  : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(pctOfMax, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-5 mt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Overall Aggregated:</span>
              <span className="font-mono font-bold text-slate-800">RM {totalSpent.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl text-[10px] text-blue-800 border border-blue-100/40">
              💡 Spreading rent represents the highest financial overhead. Keeping food grocery logs tight lowers household pressure.
            </div>
          </div>
        </div>

        {/* Right column: Searchable Expense Log List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filtering row */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="expense-search-input"
                placeholder="Search expense description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Category tabs filters */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                id="filter-cat-All"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Categories
              </button>
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  id={`filter-cat-${cat.name}`}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table / List of logged cards */}
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl">
                <Receipt className="mx-auto w-12 h-12 text-slate-300 mb-2" />
                <p className="font-display font-semibold text-slate-800">No matching shared bills found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try adjust your search term, filters, or record some bills on the "Add Expense" screen!</p>
              </div>
            ) : (
              filteredExpenses.map((expense) => {
                const payer = roommates.find((r) => r.id === expense.paidById);
                
                // Details of split
                const participantNames = expense.splitWithIds
                  .map((id) => roommates.find((r) => r.id === id)?.name.split(' ')[0])
                  .filter(Boolean)
                  .join(', ');

                const splitWays = expense.splitWithIds.length;
                const costPerPerson = expense.amount / splitWays;

                return (
                  <div 
                    key={expense.id}
                    id={`expense-card-${expense.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Payer Avatar */}
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-xl ${payer?.avatarColor || 'bg-slate-400'} text-white font-display text-base font-bold flex items-center justify-center shadow-xs`}>
                          {payer?.name[0] || '?'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-white border border-slate-100 shadow-xs p-1 rounded-sm text-[8px] font-bold text-slate-500 uppercase font-mono max-w-10 overflow-hidden line-clamp-1">
                          {expense.category[0]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-850 text-sm font-display leading-tight">
                            {expense.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            expense.category === 'Rent'
                              ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                              : expense.category === 'Groceries'
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                : expense.category === 'Utilities'
                                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                                  : 'text-slate-600 bg-slate-50 border-slate-200'
                          }`}>
                            {expense.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 font-medium">
                          Paid by <strong className="text-slate-600">{payer?.name || 'Unknown'}</strong> on <span className="font-mono text-[11px]">{expense.date}</span>
                        </p>

                        <p className="text-[11px] text-slate-400 font-medium select-none">
                          👥 Split equals ({splitWays} ways): <span className="text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded-sm inline-block font-mono text-[10px] my-0.5">{participantNames}</span> (RM {costPerPerson.toFixed(2)} each)
                        </p>
                      </div>
                    </div>

                    {/* Costing values and Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <div className="text-right flex items-center sm:block space-x-1 sm:space-x-0">
                        <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase leading-none block">Total Cost</span>
                        <span className="text-lg font-mono font-bold text-slate-800 leading-tight block">
                          RM {expense.amount.toFixed(2)}
                        </span>
                      </div>

                      <button
                        id={`delete-expense-${expense.id}`}
                        onClick={() => {
                          if(confirm(`Are you sure you want to delete "${expense.title}"? This is irreversible and will re-add balance offsets.`)) {
                            onDeleteExpense(expense.id);
                          }
                        }}
                        className="p-2 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer sm:mt-1"
                        title="Delete receipt record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
