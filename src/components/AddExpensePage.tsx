/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Tag, 
  Calendar, 
  FileText, 
  Users, 
  Check, 
  PlusCircle, 
  BadgeCheck, 
  Undo,
  Info
} from 'lucide-react';
import { Roommate, Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../utils/calculations';

interface AddExpensePageProps {
  currentRoommate: Roommate;
  roommates: Roommate[];
  onAddExpense: (title: string, amount: number, datetime: string, category: string, paidById: string, splitWithIds: string[]) => void;
  onNavigate: (page: 'dashboard' | 'expense-summary') => void;
}

export const AddExpensePage: React.FC<AddExpensePageProps> = ({
  currentRoommate,
  roommates,
  onAddExpense,
  onNavigate,
}) => {
  // Form elements state
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState(currentRoommate.id);
  const [splitWithIds, setSplitWithIds] = useState<string[]>(roommates.map(r => r.id));
  
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync split list when roommate count changes
  useEffect(() => {
    setSplitWithIds(roommates.map(r => r.id));
  }, [roommates]);

  // Handle participant toggles
  const handleToggleParticipant = (id: string) => {
    if (splitWithIds.includes(id)) {
      // Must have at least one split participant
      if (splitWithIds.length > 1) {
        setSplitWithIds(splitWithIds.filter(item => item !== id));
      }
    } else {
      setSplitWithIds([...splitWithIds, id]);
    }
  };

  const amountNumber = parseFloat(amountInput) || 0;
  const splitAmount = splitWithIds.length > 0 ? amountNumber / splitWithIds.length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Please enter an expense title / description');
      return;
    }
    if (amountNumber <= 0) {
      setValidationError('Please enter a positive numeric amount greater than RM 0.00');
      return;
    }
    if (!category) {
      setValidationError('Please select an expense category');
      return;
    }
    if (splitWithIds.length === 0) {
      setValidationError('You must select at least one roommate to split with');
      return;
    }

    onAddExpense(title.trim(), amountNumber, dateStr, category, paidById, splitWithIds);

    // Show beautiful satisfaction screen
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTitle('');
      setAmountInput('');
      setValidationError('');
      onNavigate('expense-summary');
    }, 1500);
  };

  // Preset suggestions helper
  const handleApplyPreset = (presetTitle: string, presetAmount: number, presetCat: string) => {
    setTitle(presetTitle);
    setAmountInput(presetAmount.toString());
    setCategory(presetCat);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      
      {/* Visual breadcrumbs and action */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-slate-800">
            Log Shared Expense
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Split bills fairly and instantly without spreadsheet math.
          </p>
        </div>
        <button
          id="expense-back-btn"
          onClick={() => onNavigate('dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center"
        >
          <Undo className="w-3.5 h-3.5 mr-1" /> Dashboard
        </button>
      </div>

      {isSuccess ? (
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center space-y-4 shadow-md animate-scale-up">
          <div className="mx-auto w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
            <BadgeCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="font-display font-bold text-lg text-emerald-900">
            Shared Bill Recorded!
          </h2>
          <p className="text-sm text-emerald-700 max-w-sm mx-auto">
            "{title}" of RM {amountNumber.toFixed(2)} was successfully recorded and split equally among the {splitWithIds.length} participants (RM {splitAmount.toFixed(2)} each).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Expense Creation Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            {validationError && (
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold">
                ⚠️ {validationError}
              </div>
            )}

            {/* Quick Presets section */}
            <div>
              <span className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2">
                Quick Example Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="preset-rent"
                  onClick={() => handleApplyPreset('Rent for May', 1200, 'Rent')}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  🏢 Rent RM1200
                </button>
                <button
                  type="button"
                  id="preset-groceries"
                  onClick={() => handleApplyPreset('Groceries Restock', 150, 'Groceries')}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  🛒 Groceries RM150
                </button>
                <button
                  type="button"
                  id="preset-internet"
                  onClick={() => handleApplyPreset('High-Speed WiFi Bill', 100, 'Utilities')}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-100 text-amber-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  🌐 Internet RM100
                </button>
              </div>
            </div>

            {/* Title description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Expense Title / Purpose <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Toiletries replenishment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="pl-9 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Amount input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Cost (RM) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold font-mono text-slate-400">
                    RM
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="pl-10 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Date Incured
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="pl-10 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Category dropdown & Paid By dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    id="expense-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="pl-10 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Paid By <span className="text-rose-400 font-mono text-[10px] ml-1">Paid standard cost</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    id="expense-payer-select"
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="pl-10 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {roommates.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.id === currentRoommate.id ? `Me (${user.name})` : user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Split Equal Selector participants */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Participating in Split <span className="text-slate-400 text-[10px] lowercase italic">(Select who bears this cost)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {roommates.map((member) => {
                  const isChecked = splitWithIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      id={`split-toggle-${member.id}`}
                      onClick={() => handleToggleParticipant(member.id)}
                      className={`flex items-center justify-between p-3 border rounded-xl text-left transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-500/10' 
                          : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-md ${member.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                          {member.name[0]}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-28 sm:max-w-xs">{member.name.split(' ')[0]}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                        isChecked 
                          ? 'border-blue-600 bg-blue-600 text-white' 
                          : 'border-slate-300 bg-transparent'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              id="expense-submit-btn"
              className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm p-3 rounded-xl shadow-md cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-200"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Save Bill & Split Equally
            </button>
          </form>

          {/* Splitting computation breakdown preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/60">
                <Users className="w-4 h-4 text-blue-600 animate-pulse" />
                <h3 className="font-display font-semibold text-sm text-slate-800">
                  Splitting Calculation Preview
                </h3>
              </div>

              <div className="mt-4 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                    Cost per Roommate ({splitWithIds.length} sharing)
                  </p>
                  <p className="text-2xl font-mono font-bold text-blue-700 mt-1 select-none">
                    RM {splitAmount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <span className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                    Calculated Breakdown:
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {roommates.map((member) => {
                      const isParticipant = splitWithIds.includes(member.id);
                      const isPayer = member.id === paidById;

                      return (
                        <div key={member.id} className="bg-white border border-slate-100 p-2.5 rounded-lg flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded ${member.avatarColor} text-white flex items-center justify-center text-[8px] font-bold`}>
                              {member.name[0]}
                            </span>
                            <span className="font-medium text-slate-700">{member.name.split(' ')[0]}</span>
                          </span>
                          
                          <span className="font-mono text-slate-500 font-semibold select-none text-right">
                            {isPayer && isParticipant && (
                              <span className="text-emerald-600 block text-[10px]">
                                Paid RM {amountNumber.toFixed(2)} (- RM {splitAmount.toFixed(2)})
                              </span>
                            )}
                            {isPayer && !isParticipant && (
                              <span className="text-emerald-600 block text-[10px]">
                                Paid RM {amountNumber.toFixed(2)} (+ RM {amountNumber.toFixed(2)})
                              </span>
                            )}
                            {!isPayer && isParticipant && (
                              <span className="text-amber-700 block text-[10px]">
                                Owes RM {splitAmount.toFixed(2)}
                              </span>
                            )}
                            {!isPayer && !isParticipant && (
                              <span className="text-slate-300 block text-[10px]">
                                Not in split (RM 0.00)
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-xl text-[11px] text-blue-800 border border-blue-100 flex items-start space-x-1.5 mt-4">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                Equal distribution is the fairest splitting standard. Inactive room entries do not skew billing ratios.
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
