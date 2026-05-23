/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserPlus, 
  ArrowRight, 
  Lock, 
  Building2, 
  Smile, 
  Mail, 
  Sparkles,
  Info
} from 'lucide-react';
import { Roommate, Group } from '../types';

interface LoginPageProps {
  roommates: Roommate[];
  groups: Group[];
  activeGroupId: string;
  onSelectUser: (user: Roommate) => void;
  onAddRoommate: (
    name: string,
    email: string,
    avatarColor: string,
    bankName: string,
    bankAccount: string,
    groupChoice: 'join' | 'create',
    existingGroupId?: string,
    newGroupName?: string,
    newHouseNo?: string
  ) => void;
  onSelectGroup: (groupId: string) => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-fuchsia-500'
];

export const LoginPage: React.FC<LoginPageProps> = ({
  roommates,
  groups,
  activeGroupId,
  onSelectUser,
  onAddRoommate,
  onSelectGroup,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [chosenColor, setChosenColor] = useState(AVATAR_COLORS[0]);
  const [bankName, setBankName] = useState('Maybank');
  const [bankAccount, setBankAccount] = useState('');
  const [groupChoice, setGroupChoice] = useState<'join' | 'create'>('join');
  const [existingId, setExistingId] = useState(activeGroupId);
  const [newGroupName, setNewGroupName] = useState('');
  const [newHouseNo, setNewHouseNo] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!bankAccount.trim()) {
      setErrorMsg('Please configure a valid settlements account number for housemate clearing');
      return;
    }

    if (groupChoice === 'create') {
      if (!newGroupName.trim()) {
        setErrorMsg('Please input a name for your new household unit');
        return;
      }
      if (!newHouseNo.trim()) {
        setErrorMsg('Please input a unit / house tracking code (e.g. Block A-10-02)');
        return;
      }
    }

    onAddRoommate(
      name.trim(),
      email.trim(),
      chosenColor,
      bankName.trim(),
      bankAccount.trim(),
      groupChoice,
      groupChoice === 'join' ? existingId : undefined,
      groupChoice === 'create' ? newGroupName.trim() : undefined,
      groupChoice === 'create' ? newHouseNo.trim() : undefined
    );

    // Reset Form
    setName('');
    setEmail('');
    setBankName('Maybank');
    setBankAccount('');
    setGroupChoice('join');
    setNewGroupName('');
    setNewHouseNo('');
    setChosenColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setIsRegistering(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-blue-50/50 via-white to-slate-50">
      <div className="max-w-md w-full space-y-8">
        
        {/* Brand visual header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-xl shadow-blue-100 mb-4 animate-bounce">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-slate-900">
            Welcome to Split<span className="text-blue-600">Mate</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            A frictionless shared expense system for modern households. Keep roommate split records fair, tidy and clear.
          </p>
        </div>

        {/* Group selector context */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
            Active Household Context
          </label>
          <select
            id="group-select-login"
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm p-2.5 font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            value={activeGroupId}
            onChange={(e) => onSelectGroup(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                📍 {group.name} ({group.houseNo})
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>Select/create group inside dashboard once logged in.</span>
          </div>
        </div>

        {/* Main interactive switcher */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">
          {!isRegistering ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-semibold text-lg text-slate-800">
                  Select Your Profile
                </h3>
                <button
                  id="toggle-register-btn"
                  onClick={() => setIsRegistering(true)}
                  className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Add New
                </button>
              </div>

              {/* Roommate list */}
              <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-1">
                {roommates.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">No roommates registered. Create one to begin!</p>
                ) : (
                  roommates.map((user) => (
                    <button
                      key={user.id}
                      id={`login-user-${user.id}`}
                      onClick={() => onSelectUser(user)}
                      className="group flex items-center justify-between p-3.5 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition-all text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl ${user.avatarColor} text-white flex items-center justify-center font-display font-semibold text-sm shadow-xs group-hover:scale-105 transition-transform`}>
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start space-x-2">
                <Lock className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  This sandbox simulated vault stores your splitting sessions locally in your browser. Feel free to log in as different roommates to evaluate their distinct financial perspectives!
                </span>
              </div>
            </div>
          ) : (
            // Register Guest Roommate form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-semibold text-lg text-slate-800">
                  Join Suite as Housemate
                </h3>
                <button
                  type="button"
                  id="cancel-register-btn"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Form entries */}
              <div className="space-y-4">
                {/* Step 1: Personal Details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 py-1 px-2.5 rounded self-start inline-block">
                    1. Account Profile
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Roommate Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Smile className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        className="pl-9 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="e.g. Samuel Jackson"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        className="pl-9 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm p-2.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="e.g. sam@splitmate.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Persona Color Avatar choosing */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      Avatar Visual Color Profile
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setChosenColor(color)}
                          className={`w-8 h-8 rounded-full ${color} cursor-pointer border-2 transition-all ${
                            color === chosenColor 
                              ? 'ring-2 ring-blue-500 scale-110 border-white' 
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 2: Banking Coordinates */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 py-1 px-2.5 rounded self-start inline-block">
                    2. Payout Bank Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Bank Coordinator
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Maybank">Maybank</option>
                        <option value="CIMB Bank">CIMB Bank</option>
                        <option value="Public Bank">Public Bank</option>
                        <option value="Touch n Go eWallet">Touch n Go eWallet</option>
                        <option value="Standard Chartered">Standard Chartered</option>
                        <option value="HSBC Bank">HSBC Bank</option>
                        <option value="Other Bank">Other Coordinator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        AccountNumber <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1140-1234-56"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Household Choice */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 py-1 px-2.5 rounded self-start inline-block">
                    3. Household Assignment
                  </h4>
                  
                  {/* Join vs Create switcher tabs */}
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setGroupChoice('join')}
                      className={`text-xs py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        groupChoice === 'join' 
                          ? 'bg-white shadow-xs text-blue-600' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      Join Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupChoice('create')}
                      className={`text-xs py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        groupChoice === 'create' 
                          ? 'bg-white shadow-xs text-blue-600' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      Create Unique
                    </button>
                  </div>

                  {groupChoice === 'join' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Available Suite / House to join
                      </label>
                      <select
                        value={existingId}
                        onChange={(e) => setExistingId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            🏡 {g.name} ({g.houseNo})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2 border border-blue-100 bg-blue-50/20 p-3 rounded-lg">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Household Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Garden Heights Penthouse"
                          className="w-full bg-white border border-slate-200 text-slate-850 text-xs p-2 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Unit / House No
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Block C-18-09"
                          className="w-full bg-white border border-slate-200 text-slate-850 text-xs p-2 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={newHouseNo}
                          onChange={(e) => setNewHouseNo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                id="submit-register-btn"
                className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs p-3 rounded-xl shadow-md cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-200"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Complete Registration & Sign-In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
