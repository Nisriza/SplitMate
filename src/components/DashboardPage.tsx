/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Plus, 
  Users, 
  ArrowRightLeft, 
  DollarSign, 
  TrendingUp, 
  BadgeAlert, 
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  UserPlus,
  Bell,
  QrCode,
  Link,
  Copy,
  Check,
  Upload
} from 'lucide-react';
import { Roommate, Group, Expense, PaymentActivity } from '../types';
import { calculateBalances, computeSuggestedSettlements } from '../utils/calculations';

interface DashboardPageProps {
  currentRoommate: Roommate;
  roommates: Roommate[];
  groups: Group[];
  activeGroupId: string;
  expenses: Expense[];
  payments: PaymentActivity[];
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string, type: 'roommates' | 'housemates', houseNo: string) => void;
  onJoinGroup: (code: string) => { success: boolean; error?: string };
  onQuickSettle: (fromId: string, toId: string, amount: number) => void;
  onNavigate: (page: 'add-expense' | 'expense-summary' | 'payment-status') => void;
  onSendReminder: (toId: string, amount: number, billTitle?: string) => void;
  onUpdateBankProfile: (id: string, bankName: string, bankAccount: string, qrCodeDataUrl?: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentRoommate,
  roommates,
  groups,
  activeGroupId,
  expenses,
  payments,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  onQuickSettle,
  onNavigate,
  onSendReminder,
  onUpdateBankProfile,
  onLeaveGroup,
  onDeleteGroup,
}) => {
  // Local state for group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'roommates' | 'housemates'>('roommates');
  const [newGroupHouseNo, setNewGroupHouseNo] = useState('');
  const [groupError, setGroupError] = useState('');

  // Local state for join group code box
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Local state for roommate payment/QR configuration
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [myBankName, setMyBankName] = useState(currentRoommate.bankName || 'Maybank');
  const [myBankAccount, setMyBankAccount] = useState(currentRoommate.bankAccount || '');
  
  // Local notification confirmation flash message
  const [buzzConfirmedText, setBuzzConfirmedText] = useState<string | null>(null);

  // Invite link/code copy feedback state
  const [copiedCodeType, setCopiedCodeType] = useState<'code' | 'link' | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeType('code');
    setTimeout(() => setCopiedCodeType(null), 2000);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedCodeType('link');
    setTimeout(() => setCopiedCodeType(null), 2000);
  };

  const myGroups = groups.filter((g) => g.roommateIds.includes(currentRoommate.id));
  const activeGroup = groups.find(g => g.id === activeGroupId && g.roommateIds.includes(currentRoommate.id)) || myGroups[0] || null;
  const isMember = activeGroup ? activeGroup.roommateIds.includes(currentRoommate.id) : false;

  // Filter roommates belonging to current group
  const activeMembers = isMember 
    ? roommates.filter(r => activeGroup.roommateIds.includes(r.id))
    : [currentRoommate];

  // Compute Balances
  const balances = isMember 
    ? calculateBalances(activeMembers, expenses, payments)
    : { [currentRoommate.id]: 0 };

  // Compute simplified debt transactions
  const settlements = isMember 
    ? computeSuggestedSettlements(activeMembers, balances)
    : [];

  // Stats calculation
  const totalHouseExpense = isMember 
    ? expenses.reduce((sum, exp) => sum + exp.amount, 0)
    : 0;
  
  // Custom user balance
  const myBalance = balances[currentRoommate.id] || 0;



  // Handles join group click
  const handleJoinGroupClick = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess(false);

    if (!joinCodeInput.trim()) {
      setJoinError('Suite invitation code is required.');
      return;
    }

    const res = onJoinGroup(joinCodeInput.trim()) as { success: boolean; error?: string; alreadyJoined?: boolean };
    if (res.success) {
      if (res.alreadyJoined) {
        setJoinError('ℹ️ You are already a member of this suite group!');
      } else {
        setJoinSuccess(true);
        setJoinCodeInput('');
        setTimeout(() => setJoinSuccess(false), 5000);
      }
    } else {
      setJoinError(res.error || 'Could not join suite.');
    }
  };

  // Trigger alert notification buzz
  const handleTriggerBuzz = (toId: string, name: string, amount: number) => {
    onSendReminder(toId, Math.abs(amount), 'Rent & Groceries Shared House Settle-up');
    setBuzzConfirmedText(`Success! A digital reminder has been pushed to ${name} to settle RM ${Math.abs(amount).toFixed(2)}. This alert will show in their top-right notification bell!`);
    setTimeout(() => {
      setBuzzConfirmedText(null);
    }, 5000);
  };

  // Handle bank info submit
  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBankProfile(currentRoommate.id, myBankName, myBankAccount, currentRoommate.qrCodeDataUrl);
    setIsEditingBank(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Toast Alert Confirmation */}
      {buzzConfirmedText && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-start space-x-3 shadow-md animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Real-time Push Notification Buzz Triggered</p>
            <p className="text-emerald-700 font-medium mt-0.5">{buzzConfirmedText}</p>
          </div>
        </div>
      )}
      
      {/* Hello Board banner */}
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-blue-100 bg-blue-800/40 px-3 py-1 rounded-full border border-blue-500/30">
            {activeGroup ? (activeGroup.type === 'roommates' ? '👥 ROOMMATE GROUP VIEW' : '🏠 HOUSEMATE SUITE VIEW') : '⚠️ MATE VIEW'}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl mt-3 tracking-tight">
            Hi, @{currentRoommate.username || currentRoommate.name}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            {activeGroup 
              ? `Active suite: ${activeGroup.name} (Unit ${activeGroup.houseNo}). Track and split everything with zero awkwardness.`
              : "Didn't join any group yet. Track and split everything with zero awkwardness!"
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="dash-add-expense-btn"
            onClick={() => onNavigate('add-expense')}
            className="px-5 py-3 bg-white text-blue-700 font-semibold text-sm rounded-xl shadow-md hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Add Joint Bill
          </button>
          <button
            id="dash-settle-up-btn"
            onClick={() => onNavigate('payment-status')}
            className="px-5 py-3 bg-blue-800/40 border border-blue-400/30 text-white font-semibold text-sm rounded-xl hover:bg-blue-800/60 transition-all cursor-pointer flex items-center"
          >
            <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Settlements
          </button>
        </div>
      </div>

      {/* Multi-group Selector Banner when joined in > 1 groups */}
      {myGroups.length > 1 && (
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">You belong to {myGroups.length} Suite Groups!</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Quickly select or swap between your suites to view corresponding ledgers.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-bold text-blue-700 font-mono uppercase">Select Suite:</span>
            <select
              value={activeGroupId}
              onChange={(e) => onSelectGroup(e.target.value)}
              className="bg-white border border-blue-250 font-display text-xs font-bold rounded-xl text-slate-705 py-2 px-3 shadow-xs cursor-pointer focus:ring-1 focus:ring-blue-600"
            >
              {myGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Unit {g.houseNo})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Joint Setup: Create Group or Join Group using Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        
        {/* Join Suite card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-blue-600/15 border border-blue-500/20 text-blue-400 rounded-xl shrink-0">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-slate-100">Join a Suite Group</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Enter an Invitation Code shared by your roommates to instantly access their shared split-balances.
                </p>
              </div>
            </div>
            
            {joinError && (
              <div className="p-3 bg-red-950 text-red-100 border-2 border-red-500 rounded-xl text-xs font-bold font-mono mt-3 animate-fade-in text-white">
                ⚠️ {joinError}
              </div>
            )}
            {joinSuccess && (
              <div className="p-3 bg-emerald-950 text-emerald-100 border-2 border-emerald-500 rounded-xl text-xs font-bold font-mono mt-3 animate-fade-in text-white">
                ✅ Successfully joined suite group! The ledger has synced instantly.
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="e.g. COSY-101"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono py-2.5 px-3 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 grow uppercase tracking-wider"
              />
              <button
                type="button"
                id="join-suite-action-btn"
                onClick={handleJoinGroupClick}
                className="bg-blue-600 hover:bg-blue-550 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition shrink-0"
              >
                Join Code
              </button>
            </div>
          </div>

          {/* Copy invite info for activeGroup */}
          {activeGroup && (
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Share Code:</span>
              <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-750 font-mono">
                <span className="text-blue-400 font-bold tracking-wider">{activeGroup.joinCode}</span>
                <button
                  id="copy-invite-code-btn"
                  type="button"
                  onClick={() => handleCopyCode(activeGroup.joinCode || 'COSY-101')}
                  className="p-1 hover:bg-slate-700 hover:text-white rounded transition cursor-pointer"
                  title="Copy Invite Code"
                >
                  {copiedCodeType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Suite card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                <Building className="w-5 h-5 shadow-xs" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-slate-800">Create a New Suite Group</h3>
                <p className="text-slate-450 text-xs mt-0.5">
                  Form a secure shared household suite with automatic calculated split ledgers.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Lavender Suite"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 grow"
              />
              <input
                type="text"
                placeholder="House No."
                value={newGroupHouseNo}
                onChange={(e) => setNewGroupHouseNo(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-850 text-xs font-mono py-2 px-3 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 max-w-[100px]"
              />
              <button
                type="button"
                id="create-suite-action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setGroupError('');
                  if (!newGroupName.trim() || !newGroupHouseNo.trim()) {
                    setGroupError('Fill both fields.');
                    return;
                  }
                  onCreateGroup(newGroupName.trim(), 'roommates', newGroupHouseNo.trim());
                  setNewGroupName('');
                  setNewGroupHouseNo('');
                }}
                className="bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition shrink-0"
              >
                Create
              </button>
            </div>
            {groupError && (
              <p className="text-xs font-semibold text-rose-600">⚠️ {groupError}</p>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 italic">
            💡 Initializing a group starts a pristine ledger at RM 0.00. Show or share this invite code with other mates to have them login and join!
          </div>
        </div>
      </div>

      {/* Bento Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat card 1: Personal Balance status */}
        <div className={`p-6 rounded-2xl border bg-white shadow-xs ${
          myBalance > 0.01 
            ? 'border-emerald-200 ring-2 ring-emerald-500/5' 
            : myBalance < -0.01 
              ? 'border-amber-200 ring-2 ring-amber-500/5' 
              : 'border-slate-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Your Net Standing
            </span>
            <span className={`p-1.5 rounded-lg text-xs font-semibold ${
              myBalance > 0.01 
                ? 'bg-emerald-50 text-emerald-600' 
                : myBalance < -0.01 
                  ? 'bg-amber-100 text-amber-700 font-bold' 
                  : 'bg-slate-50 text-slate-500'
            }`}>
              {myBalance > 0.01 ? 'You are owed' : myBalance < -0.01 ? 'You owe overall' : 'Settle-up done'}
            </span>
          </div>
          
          <div className="mt-4 flex items-baseline">
            <span className="text-xs font-semibold text-slate-400 mr-1.5 font-mono">RM</span>
            <span className={`text-3xl font-display font-bold tracking-tight font-mono ${
              myBalance > 0.01 
                ? 'text-emerald-600' 
                : myBalance < -0.01 
                  ? 'text-amber-800' 
                  : 'text-slate-800'
            }`}>
              {Math.abs(myBalance).toFixed(2)}
            </span>
          </div>

          <div className="mt-4 text-xs">
            {myBalance > 0.01 ? (
              <span className="text-emerald-600 font-medium select-none">
                🌟 Housemates will pay you back RM {myBalance.toFixed(2)} total!
              </span>
            ) : myBalance < -0.01 ? (
              <span className="text-amber-700 font-medium select-none">
                ⚠️ Click Settlements tab or pay below to clear RM {Math.abs(myBalance).toFixed(2)}.
              </span>
            ) : (
              <span className="text-slate-500 font-medium select-none">
                ✅ Excellent state! You don't owe or owe any money inside this household.
              </span>
            )}
          </div>
        </div>

        {/* Stat card 2: Total Joint household spent */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Total Household Bills
            </span>
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold font-mono">
              RM
            </span>
          </div>
          
          <div className="mt-4 flex items-baseline">
            <span className="text-xs font-semibold text-slate-400 mr-1.5 font-mono">RM</span>
            <span className="text-3xl font-display font-bold text-slate-800 tracking-tight font-mono">
              {totalHouseExpense.toFixed(2)}
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Aggregated sum of all Rent, Utilities and Grocery logs paid through SplitMate.
          </p>
        </div>

        {/* Stat card 3: Group metadata & switcher */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          {activeGroup ? (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Active Household Info
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono tracking-wider">
                    {activeGroup.type.toUpperCase()}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 font-display text-base">
                  {activeGroup.name}
                </h4>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Unit: {activeGroup.houseNo}</span>
                </div>
                
                {/* Leave / Delete Group operations */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex gap-2">
                  {isMember ? (
                    <button
                      type="button"
                      id="leave-active-group-btn"
                      onClick={() => {
                        if (confirm(`Confirm leaving the suite group "${activeGroup.name}"? You will no longer view or share transaction entries in this suite.`)) {
                          onLeaveGroup?.(activeGroup.id);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/60 text-amber-700 font-bold text-[10px] rounded-lg transition-all border border-amber-200/50 cursor-pointer"
                    >
                      🚪 Leave Suite
                    </button>
                  ) : (
                    <span className="px-2.5 py-1.5 bg-slate-50 text-slate-400 text-[10px] rounded-lg border border-slate-200">
                      ⚠️ Guest View
                    </span>
                  )}

                  <button
                    type="button"
                    id="delete-active-group-btn"
                    onClick={() => {
                      if (confirm(`⚠️ CRITICAL WARNING: Are you sure you want to completely DELETE "${activeGroup.name}"? This action cannot be undone, and all joint bills logged under this suite will be erased permanently!`)) {
                        onDeleteGroup?.(activeGroup.id);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-150/60 text-rose-700 font-bold text-[10px] rounded-lg transition-all border border-rose-200/50 cursor-pointer"
                  >
                    🗑️ Delete Group
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-mono uppercase">Invite Code:</span>
                <span className="text-[11px] bg-blue-50 text-blue-700 font-mono font-bold py-1 px-2.5 rounded border border-blue-100">
                  Code: {activeGroup.joinCode || 'COSY-101'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Active Household Info
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono tracking-wider">
                    NONE
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 font-display text-base">
                  Didn't join any group yet
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  You are currently a solo user. Fill out "Create a New Suite Group" or enter an invitation code to participate in shared billing ledger balances!
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 italic">
                🔒 Active household code and statistics will unlock automatically upon suite joining.
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Main dashboard content splitting splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Roommate detail balances lists */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-semibold text-base text-slate-800">
                  Roommate Balance Details
                </h3>
              </div>
              
              {/* Group selection specifically of joined groups */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase font-mono">View Suite</span>
                {myGroups.length > 0 ? (
                  <select
                    id="group-balance-selector"
                    value={activeGroupId}
                    onChange={(e) => onSelectGroup(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl text-slate-700 p-2 cursor-pointer transition focus:ring-1 focus:ring-blue-500 max-w-[170px]"
                  >
                    {myGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 font-mono">
                    None Joined
                  </span>
                )}
              </div>
            </div>

            {/* Roommate details active card lists */}
            <div className="mt-6 space-y-3">
              {activeMembers.map((member) => {
                const bal = balances[member.id] || 0;
                const isMe = member.id === currentRoommate.id;

                return (
                  <div 
                    key={member.id}
                    id={`roommate-bal-card-${member.id}`}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isMe 
                        ? 'border-blue-200/50 bg-blue-50/20' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl ${member.avatarColor} text-white font-display text-sm font-bold flex items-center justify-center shadow-xs`}>
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-800 text-sm">
                            {member.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Net Balance
                        </div>
                        <div className={`text-sm font-mono font-bold ${
                          bal > 0.01 
                            ? 'text-emerald-600' 
                            : bal < -0.01 
                              ? 'text-amber-700' 
                              : 'text-slate-500'
                        }`}>
                          {bal > 0.01 ? '+' : ''}RM {bal.toFixed(2)}
                        </div>
                      </div>

                      {bal < -0.01 && !isMe && (
                        <button
                          onClick={() => handleTriggerBuzz(member.id, member.name, bal)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 active:scale-95 text-blue-600 rounded-xl border border-blue-100 transition shadow-xs flex items-center justify-center cursor-pointer group"
                          title={`Send payment push reminder to ${member.name}`}
                        >
                          <Bell className="w-3.5 h-3.5 col-span-1 group-hover:rotate-12 transition-transform" />
                          <span className="text-[10px] font-bold ml-1 hidden sm:inline">Buzz</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Balances automatically compute offset of all entered expenses subtract shared split proportions.</span>
          </div>
        </div>

        {/* Right Side: Simplified Debt Settle-up Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/60">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <h3 className="font-display font-semibold text-lg text-slate-800">
                Simplified Debt Settle-Up
              </h3>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Based on the current household expenditures, SplitMate has compiled the optimized set of payments needed to bring all members' obligations to RM 0.00:
            </p>

            {/* Settle up lists */}
            <div className="mt-6 space-y-3">
              {settlements.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="font-display font-bold text-slate-800 text-sm">House is Fully Settled!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending simplified debts exist in this pool.</p>
                </div>
              ) : (
                settlements.map((settle, i) => {
                  const fromUser = roommates.find(r => r.id === settle.fromId);
                  const toUser = roommates.find(r => r.id === settle.toId);
                  if (!fromUser || !toUser) return null;

                  return (
                    <div 
                      key={i}
                      id={`settlement-row-${i}`}
                      className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-xs hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {fromUser.name.split(' ')[0]}
                        </span>
                        <span className="text-slate-400 font-bold">pays</span>
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {toUser.name.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm font-bold text-slate-800">
                          RM {settle.amount.toFixed(2)}
                        </span>
                        <button
                          id={`quick-settle-${i}`}
                          onClick={() => onQuickSettle(settle.fromId, settle.toId, settle.amount)}
                          className="px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wider rounded-md uppercase cursor-pointer transition-colors"
                        >
                          Log Paid
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60">
            <h5 className="font-display font-bold text-xs text-slate-700 mb-2">Example Bills Reference:</h5>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-500">
              <div className="bg-white border rounded p-2 text-center">
                <p className="font-bold text-slate-800">Rent</p>
                <p className="text-blue-600 mt-0.5">RM 1,200</p>
              </div>
              <div className="bg-white border rounded p-2 text-center">
                <p className="font-bold text-slate-800">Groceries</p>
                <p className="text-blue-600 mt-0.5">RM 150</p>
              </div>
              <div className="bg-white border rounded p-2 text-center">
                <p className="font-bold text-slate-800">Internet</p>
                <p className="text-blue-600 mt-0.5">RM 100</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Settle-up Credentials Hub */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-sm">
              Instant Bank Transfers
            </span>
            <h3 className="font-display font-semibold text-lg text-slate-800 mt-2">
              My Settlement Coordinates & QR Codes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These payment details are displayed to other housemates when they clear bills back to you. Customize them to fit your bank accounts or e-wallets.
            </p>
          </div>
          
          {!isEditingBank ? (
            <button
              onClick={() => {
                setMyBankName(currentRoommate.bankName || 'Maybank');
                setMyBankAccount(currentRoommate.bankAccount || '1140-1234-5678');
                setIsEditingBank(true);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-xl text-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              Configure Accounts
            </button>
          ) : null}
        </div>

        {isEditingBank ? (
          <form onSubmit={handleBankSubmit} className="mt-6 bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-up">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Update Your Payout Credentials</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bank or E-Wallet Name</label>
                <input
                  type="text"
                  value={myBankName}
                  onChange={(e) => setMyBankName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs p-2.5 focus:ring-1 focus:ring-blue-500 font-medium"
                  placeholder="e.g. Maybank, CIMB, Touch n Go eWallet"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Account Number / ID Coordinates</label>
                <input
                  type="text"
                  value={myBankAccount}
                  onChange={(e) => setMyBankAccount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-xs p-2.5 focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 114022339944"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingBank(false)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Save Details
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            
            {/* Coordinates widget */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Settlement Account</span>
                <p className="font-display font-bold text-slate-800 text-base mt-2">{currentRoommate.bankName || 'Maybank'}</p>
                <p className="font-mono text-xs text-blue-700 font-bold bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-100 mt-2 tracking-widest inline-block select-all">
                  {currentRoommate.bankAccount || '1140-1234-5678'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex gap-1">
                <span className="text-[10px] text-slate-400 font-mono">Status: Active & Verified</span>
              </div>
            </div>

            {/* DuitNow Simulated Custom QR Code Visualizer Component */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex flex-col md:flex-row items-center gap-4 col-span-2">
              
              {/* Outer Simulated QR Frame */}
              <div className="p-2.5 bg-white border border-slate-200/60 rounded-2xl shadow-xs relative shrink-0">
                
                {/* DuitNow Magenta/Pink Header Simulator Block */}
                <div className="absolute top-1 left-1.5 right-1.5 h-1.5 rounded-t bg-gradient-to-r from-pink-600 to-rose-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
 
                {currentRoommate.qrCodeDataUrl ? (
                  <img
                    src={currentRoommate.qrCodeDataUrl}
                    alt="My Bank QR Code"
                    className="mt-2 w-28 h-28 object-contain rounded-lg border border-slate-200 select-none animate-fade-in"
                  />
                ) : (
                  /* Dot Matrix QR Grid Canvas falling back to dynamic look */
                  <div className="mt-2 w-28 h-28 bg-slate-100 border border-slate-200/80 rounded-lg flex flex-col p-1 justify-between select-none">
                    {/* Row 1 */}
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-4 border-slate-800 bg-white" />
                      <div className="w-4 h-1 bg-slate-800" />
                      <div className="w-6 h-6 border-4 border-slate-800 bg-white" />
                    </div>
                    {/* Row 2 (Middle data pixels) */}
                    <div className="flex justify-around items-center h-12">
                      <div className="flex flex-col gap-1">
                        <div className="w-2 h-2 bg-slate-800" />
                        <div className="w-1.5 h-1.5 bg-slate-800" />
                      </div>
                      {/* Micro Central human badge logo mapping */}
                      <div className="w-8 h-8 rounded bg-pink-500 text-white flex items-center justify-center font-bold text-[8px] font-mono leading-none ring-2 ring-white shadow-xs">
                        {currentRoommate.name[0]}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-850" />
                        <div className="w-2 h-2 bg-slate-850" />
                      </div>
                    </div>
                    {/* Row 3 */}
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-4 border-slate-800 bg-white" />
                      <div className="w-4 h-1.5 bg-slate-800 self-end" />
                      <div className="w-3 h-3 bg-slate-800" />
                    </div>
                  </div>
                )}
                <div className="text-[8px] font-mono font-bold text-center mt-1 text-slate-400">
                  {currentRoommate.qrCodeDataUrl ? 'Your Custom Bank QR' : 'Duitnow QR Sandbox'}
                </div>
              </div>
 
              {/* QR explanation & Upload file */}
              <div className="flex-grow space-y-3">
                <span className="text-[9px] font-mono font-semibold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wide inline-block">
                  Interactive DuitNow QR Sandbox
                </span>
                <p className="text-xs text-slate-600 leading-tight">
                  Our system displays your QR payload when other housemates clear bills back to you. They can scan it right off your screen or mobile phone for instant payout!
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    Upload Your Official Bank or e-Wallet QR Photo:
                  </label>
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition text-center shadow-xs flex items-center justify-center gap-1.5 self-start">
                    <Upload className="w-3.5 h-3.5" />
                    Upload QR Photo
                    <input
                      type="file"
                      id="upload-my-qr"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              onUpdateBankProfile(
                                currentRoommate.id,
                                currentRoommate.bankName || 'Maybank',
                                currentRoommate.bankAccount || '',
                                reader.result
                              );
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Supports JPG, PNG, or screenshotted QR code codes. The system generates this dynamic look immediately.
                  </p>
                </div>
              </div>
 
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
