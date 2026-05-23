/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserPlus, 
  Lock, 
  Building2, 
  Smile, 
  Sparkles,
  LogIn,
  Check,
  User
} from 'lucide-react';
import { Roommate, Group } from '../types';

interface LoginPageProps {
  roommates: Roommate[];
  groups: Group[];
  activeGroupId: string;
  onSelectUser: (user: Roommate) => void;
  onAddRoommate: (
    name: string,
    username: string,
    password: string,
    avatarColor: string
  ) => void;
  onSelectGroup: (groupId: string) => void;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-sky-600',
  'bg-fuchsia-600'
];

export const LoginPage: React.FC<LoginPageProps> = ({
  roommates,
  groups,
  onSelectUser,
  onAddRoommate,
  onSelectGroup,
}) => {
  // Tabs: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Sign in states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Register Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [chosenColor, setChosenColor] = useState(AVATAR_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle username manual login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMsg('');

    const trimmedUser = loginUsername.trim().toLowerCase();
    if (!trimmedUser) {
      setLoginError('Please enter your username');
      return;
    }

    const matchedUser = roommates.find(r => (r.username || '').toLowerCase() === trimmedUser);
    if (matchedUser) {
      // If roommate has a password, verify it
      if (matchedUser.password && matchedUser.password !== loginPassword) {
        setLoginError('Incorrect password! Please verify your password and try again.');
        return;
      }

      // Find what group they belong to, if any
      const groupOfUser = groups.find(g => g.roommateIds.includes(matchedUser.id));
      if (groupOfUser) {
        onSelectGroup(groupOfUser.id);
      }
      onSelectUser(matchedUser);
    } else {
      setLoginError('This username is not registered yet! Please sign up under the Register tab first.');
    }
  };

  // Handle new registrations
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoginSuccessMsg('');

    const trimmedName = name.trim();
    const trimmedUser = username.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMsg('Please enter your display name');
      return;
    }
    if (!trimmedUser) {
      setErrorMsg('Please choose a username');
      return;
    }
    if (trimmedUser.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      return;
    }
    if (!password) {
      setErrorMsg('Please set a login password');
      return;
    }

    // Check if username already exists
    if (roommates.some(r => (r.username || '').toLowerCase() === trimmedUser)) {
      setErrorMsg('This username is already taken. Try another!');
      return;
    }

    onAddRoommate(
      trimmedName,
      trimmedUser,
      password,
      chosenColor
    );

    // Switch to login page & set success message
    setLoginUsername(trimmedUser);
    setLoginPassword('');
    setLoginSuccessMsg(`🎉 Success! Account "${trimmedName}" was created successfully. Please sign in below using your password!`);
    setActiveTab('login');

    // Reset Form
    setName('');
    setUsername('');
    setPassword('');
    setChosenColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-slate-50 via-white to-blue-50/20">
      <div className="max-w-md w-full space-y-6">
        
        {/* Unified Visual Brand Logo */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-550 text-white shadow-lg shadow-blue-150 relative overflow-hidden group">
            <Building2 className="w-7 h-7 relative z-10 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h2 className="font-display font-black text-3xl tracking-tight text-slate-850">
            Split<span className="text-blue-600">Mate</span>
          </h2>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            The frictionless, transparent shared expense system for modern suites. Balance accounts, track bills, and stay square.
          </p>
        </div>

        {/* Central Switcher & Control Panel Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100/80 border border-slate-200/80 overflow-hidden">
          
          {/* Segmented Sign In vs Register Tab Controller Selector */}
          <div className="grid grid-cols-2 bg-slate-50/80 border-b border-slate-105 p-1.5">
            <button
              type="button"
              id="tab-select-login"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              id="tab-select-register"
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* BLOCK A: SIGN-IN FLOW */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in duration-200">
                {loginSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-xl text-[11px] font-semibold animate-bounce-subtle">
                    {loginSuccessMsg}
                  </div>
                )}

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[11px] font-semibold">
                    ⚠️ {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. alextan"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="pl-9 pr-4 w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 pr-4 w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
                >
                  Sign In
                </button>
                
                {/* Visual Hint for demo validation */}
                <div className="pt-2 text-center">
                  <span className="text-[10px] text-slate-400">
                    💡 Existing users username: <strong className="text-slate-500">alextan</strong>, <strong className="text-slate-500">jordan</strong>, <strong className="text-slate-500">taylor</strong> (Password is <span className="font-mono">password</span>)
                  </span>
                </div>
              </form>
            )}

            {/* BLOCK B: REGISTRATION FLOW */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in duration-200">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-150 text-rose-600 rounded-xl text-xs font-semibold">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Smile className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="pl-9 w-full bg-slate-50/50 border border-slate-200 text-slate-850 text-xs p-2.5 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      placeholder="e.g. Samuel Jackson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="pl-9 w-full bg-slate-50/50 border border-slate-200 text-slate-850 text-xs p-2.5 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white lowercase"
                      placeholder="e.g. samuel"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      className="pl-9 w-full bg-slate-50/50 border border-slate-200 text-slate-850 text-xs p-2.5 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Color Avatar Accent selecting */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                    Visual Accent Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setChosenColor(color)}
                        className={`w-7 h-7 rounded-sm ${color} cursor-pointer transition-all flex items-center justify-center text-white text-[10px] ${
                          color === chosenColor 
                            ? 'ring-2 ring-blue-600 scale-110 shadow-md' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {color === chosenColor && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign up & redirect */}
                <button
                  type="submit"
                  id="submit-register-btn"
                  className="w-full mt-4 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider p-3 rounded-2xl shadow-md cursor-pointer transition-all uppercase"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign Up & Register
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
