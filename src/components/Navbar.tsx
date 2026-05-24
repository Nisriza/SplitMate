/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  PlusCircle, 
  Receipt, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  UserCheck,
  Bell,
  Check,
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Roommate, Group, AppPage, AppReminder } from '../types';

interface NavbarProps {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  currentRoommate: Roommate | null;
  onLogout: () => void;
  activeGroup: Group | undefined;
  reminders: AppReminder[];
  onClearReminder: (id: string) => void;
  roommates: Roommate[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  currentRoommate,
  onLogout,
  activeGroup,
  reminders = [],
  onClearReminder,
  roommates,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Filter alarms specifically sent TO the currently logged in roommate
  const activeUserReminders = currentRoommate
    ? reminders.filter((rem) => rem.toId === currentRoommate.id)
    : [];

  const navigationItems: { page: AppPage; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <Building className="w-4 h-4" /> },
    { page: 'add-expense', label: 'Add Expense', icon: <PlusCircle className="w-4 h-4" /> },
    { page: 'expense-summary', label: 'Summary', icon: <Receipt className="w-4 h-4" /> },
    { page: 'payment-status', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  ];

  const getSenderName = (fromId: string) => {
    const sender = roommates.find((r) => r.id === fromId);
    return sender ? sender.name : 'A Roommate';
  };

  const getSenderColor = (fromId: string) => {
    const sender = roommates.find((r) => r.id === fromId);
    return sender ? sender.avatarColor : 'bg-slate-500';
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <button 
              id="brand-logo-btn"
              onClick={() => currentRoommate && setCurrentPage('dashboard')} 
              className="flex items-center space-x-2 text-blue-600 focus:outline-hidden hover:opacity-90 disabled:opacity-100 cursor-pointer"
              disabled={!currentRoommate}
            >
              <div className="bg-gradient-to-tr from-blue-600 to-sky-400 p-2 rounded-xl text-white shadow-md shadow-blue-200">
                <Users className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800">
                Split<span className="text-blue-600">Mate</span>
              </span>
            </button>

            {/* Desktop Navigation Links */}
            {currentRoommate && (
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.page}
                    id={`nav-item-${item.page}`}
                    onClick={() => setCurrentPage(item.page)}
                    className={`inline-flex items-center px-4 py-2 my-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      currentPage === item.page
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            {currentRoommate ? (
              <>
                {/* Active Group Badge & User Profile */}
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-mono text-slate-400">
                    {activeGroup?.type === 'roommates' ? 'ROOMMATE GROUP' : 'HOUSEMATE GROUP'}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {activeGroup?.name || 'No Active Group'}
                  </span>
                </div>

                {/* Real-time Notification bell system */}
                <div className="relative">
                  <button
                    id="notification-bell-btn"
                    onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                    className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                    title="Roommate Buzz Alerts"
                  >
                    <Bell className="w-5 h-5" />
                    {activeUserReminders.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                        {activeUserReminders.length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown list */}
                  {showNotificationMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-dropdown text-left">
                      <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Roommate Reminders ({activeUserReminders.length})</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-medium">Buzzed</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {activeUserReminders.length === 0 ? (
                          <div className="p-6 text-center text-slate-400">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 stroke-[1.5]" />
                            <p className="text-xs font-semibold text-slate-600">No new notification</p>
                          </div>
                        ) : (
                          activeUserReminders.map((rem) => {
                            const hasDues = rem.amount > 0.01;
                            const isJoinNotification = rem.id.includes('rem-join');

                            return (
                              <div key={rem.id} className="p-3 hover:bg-slate-50/80 transition-colors">
                                <div className="flex gap-2">
                                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-xs ${getSenderColor(rem.fromId)}`}>
                                    {getSenderName(rem.fromId)[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-600">
                                      {isJoinNotification ? (
                                        <span className="font-semibold text-slate-800">🎉 Suite Activity Notice</span>
                                      ) : rem.billTitle.includes('⚠️') || rem.billTitle.toLowerCase().includes('untrusted') ? (
                                        <span className="font-bold text-rose-600 flex items-center gap-1">❌ Proof Verification Failure</span>
                                      ) : (
                                        <>
                                          <span className="font-semibold text-slate-800">{getSenderName(rem.fromId)}</span> sent you a reminder for:
                                        </>
                                      )}
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 my-0.5 bg-slate-50 p-1 rounded border border-slate-100 truncate">
                                      {rem.billTitle}
                                    </p>
                                    <div className="flex justify-between items-end mt-1.5">
                                      {hasDues ? (
                                        <>
                                          <span className="text-xs font-bold text-slate-600 font-mono">RM {rem.amount.toFixed(2)}</span>
                                          <div className="flex gap-1.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onClearReminder(rem.id);
                                              }}
                                              className="text-[10px] hover:bg-slate-200 bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border border-slate-200"
                                              title="Dismiss reminder"
                                            >
                                              Dismiss
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">✨ Joined Suite</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onClearReminder(rem.id);
                                            }}
                                            className="text-[10px] hover:bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border border-slate-200"
                                            title="Clear notification"
                                          >
                                            Acknowledge
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50/30 text-center">
                        <p className="text-[9px] text-slate-400 font-mono flex items-center justify-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" /> Reminders trigger client side events instantly
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-full transition-all">
                  <div className={`w-6 h-6 rounded-full ${currentRoommate.avatarColor} text-white flex items-center justify-center text-xs font-bold font-display shadow-xs`}>
                    {currentRoommate.name[0]}
                  </div>
                  <span className="text-xs font-medium text-slate-700 hidden sm:inline">
                    {currentRoommate.name.split(' ')[0]}
                  </span>
                  <button 
                    id="user-logout-btn"
                    onClick={onLogout} 
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    title="Switch User / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Menu Toggle Button */}
                <div className="flex items-center md:hidden">
                  <button
                    id="mobile-menu-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
                  >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-mono bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100/40 text-blue-600/80">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Secure Billing Vault</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {currentRoommate && isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-2 pt-2 pb-4 space-y-1 shadow-inner animate-fade-in">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
            Active: {activeGroup?.name} ({activeGroup?.houseNo})
          </div>
          {navigationItems.map((item) => (
            <button
              key={item.page}
              id={`nav-item-mobile-${item.page}`}
              onClick={() => {
                setCurrentPage(item.page);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                currentPage === item.page
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="mr-3 text-blue-500">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="border-t border-slate-100 pt-3 mt-3">
            <button
              id="nav-logout-btn-mobile"
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out / Switch Housemate
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
