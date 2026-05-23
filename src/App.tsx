/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { AddExpensePage } from './components/AddExpensePage';
import { ExpenseSummaryPage } from './components/ExpenseSummaryPage';
import { PaymentStatusPage } from './components/PaymentStatusPage';
import { Roommate, Group, Expense, PaymentActivity, AppPage, AppReminder } from './types';
import { 
  INITIAL_ROOMMATES, 
  INITIAL_GROUPS, 
  INITIAL_EXPENSES, 
  INITIAL_PAYMENTS 
} from './utils/calculations';

export default function App() {
  // Page Location routing
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    const saved = localStorage.getItem('splitmate_current_page');
    return (saved as AppPage) || 'login';
  });

  // Master lists and active selectors
  const [roommates, setRoommates] = useState<Roommate[]>(() => {
    const saved = localStorage.getItem('splitmate_roommates');
    return saved ? JSON.parse(saved) : INITIAL_ROOMMATES;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('splitmate_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const saved = localStorage.getItem('splitmate_active_group_id');
    return saved || INITIAL_GROUPS[0].id;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('splitmate_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [payments, setPayments] = useState<PaymentActivity[]>(() => {
    const saved = localStorage.getItem('splitmate_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [currentRoommateId, setCurrentRoommateId] = useState<string | null>(() => {
    return localStorage.getItem('splitmate_current_user_id') || null;
  });

  // App Reminders state
  const [reminders, setReminders] = useState<AppReminder[]>(() => {
    const saved = localStorage.getItem('splitmate_reminders');
    if (saved) return JSON.parse(saved);
    // Initial defaults
    return [
      { id: 'rem-1', fromId: '3', toId: '1', amount: 25.00, date: '2026-05-23', billTitle: 'High-speed Internet Premium Broadband', isRead: false },
      { id: 'rem-2', fromId: '2', toId: '1', amount: 37.50, date: '2026-05-22', billTitle: 'Groceries Restocking Refills', isRead: false }
    ];
  });

  // Persistence hooks sync
  useEffect(() => {
    localStorage.setItem('splitmate_roommates', JSON.stringify(roommates));
  }, [roommates]);

  useEffect(() => {
    localStorage.setItem('splitmate_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('splitmate_active_group_id', activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    localStorage.setItem('splitmate_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('splitmate_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('splitmate_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    if (currentRoommateId) {
      localStorage.setItem('splitmate_current_user_id', currentRoommateId);
    } else {
      localStorage.removeItem('splitmate_current_user_id');
    }
  }, [currentRoommateId]);

  useEffect(() => {
    localStorage.setItem('splitmate_current_page', currentPage);
  }, [currentPage]);

  // Find active data records based on states
  const currentRoommate = roommates.find((r) => r.id === currentRoommateId) || null;
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  // Route back to sign-in page if no active user profiles
  useEffect(() => {
    if (!currentRoommateId && currentPage !== 'login') {
      setCurrentPage('login');
    } else if (currentRoommateId && currentPage === 'login') {
      setCurrentPage('dashboard');
    }
  }, [currentRoommateId, currentPage]);

  // Auth logins/logouts
  const handleSelectUser = (user: Roommate) => {
    setCurrentRoommateId(user.id);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentRoommateId(null);
    setCurrentPage('login');
  };

  // Update a roommate's custom bank coordinates
  const handleUpdateBankProfile = (id: string, bankName: string, bankAccount: string) => {
    setRoommates((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, bankName, bankAccount } : r
      )
    );
  };

  // Send Push Reminder notification to another roomie
  const handleSendReminder = (toId: string, amount: number, billTitle?: string) => {
    if (!currentRoommateId) return;
    const newRem: AppReminder = {
      id: `rem-${Date.now()}`,
      fromId: currentRoommateId,
      toId,
      amount,
      billTitle: billTitle || 'Settle general shared balances',
      date: new Date().toISOString().split('T')[0],
      isRead: false,
    };
    setReminders((prev) => [newRem, ...prev]);
  };

  const handleClearReminder = (remId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== remId));
  };

  // Group modifiers
  const handleCreateGroup = (name: string, type: 'roommates' | 'housemates', houseNo: string) => {
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name,
      type,
      houseNo,
      roommateIds: roommates.map((r) => r.id), // Initialize with everyone so it is fully interactive
    };

    setGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
  };

  // Add roommate profile with bank properties & group choice join/creation option
  const handleRegisterRoommateAndLogin = (
    name: string,
    email: string,
    avatarColor: string,
    bankName: string,
    bankAccount: string,
    groupChoice: 'join' | 'create',
    existingGroupId?: string,
    newGroupName?: string,
    newHouseNo?: string
  ) => {
    const newPersonId = `usr-${Date.now()}`;
    const newPerson: Roommate = {
      id: newPersonId,
      name,
      email,
      avatarColor,
      bankName: bankName || 'Maybank',
      bankAccount: bankAccount || `1140-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      qrType: (bankName || '').toLowerCase().includes('wallet') ? 'duitnow' : 'bank'
    };

    setRoommates((prev) => [...prev, newPerson]);
    
    if (groupChoice === 'create' && newGroupName && newHouseNo) {
      const newGroupId = `grp-${Date.now()}`;
      const newGroup: Group = {
        id: newGroupId,
        name: newGroupName,
        type: 'roommates',
        houseNo: newHouseNo,
        roommateIds: [newPersonId]
      };
      setGroups((prev) => [...prev, newGroup]);
      setActiveGroupId(newGroupId);
    } else {
      const targetGroup = existingGroupId || activeGroupId;
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === targetGroup
            ? { ...g, roommateIds: [...g.roommateIds, newPersonId] }
            : g
        )
      );
      if (existingGroupId) {
        setActiveGroupId(existingGroupId);
      }
    }

    // Auto sign in as this person!
    setCurrentRoommateId(newPersonId);
    setCurrentPage('dashboard');
  };

  const handleAddRoommateToActiveGroup = (name: string, email: string, avatarColor: string) => {
    const newPerson: Roommate = {
      id: `usr-${Date.now()}`,
      name,
      email,
      avatarColor,
      bankName: 'Maybank',
      bankAccount: '1622-0055-' + Math.floor(1000 + Math.random() * 9000),
      qrType: 'duitnow'
    };

    setRoommates((prev) => [...prev, newPerson]);
    
    // Specific injection
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === activeGroupId
          ? { ...g, roommateIds: [...g.roommateIds, newPerson.id] }
          : g
      )
    );
  };

  // Expense Modifiers
  const handleAddExpense = (
    title: string,
    amount: number,
    date: string,
    category: string,
    paidById: string,
    splitWithIds: string[]
  ) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title,
      amount,
      date,
      category,
      paidById,
      splitWithIds,
    };

    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
  };

  // Payment Transfers Modifiers
  const handleAddPayment = (
    fromId: string,
    toId: string,
    amount: number,
    date: string,
    note: string,
    status: 'pending' | 'completed'
  ) => {
    const newPayment: PaymentActivity = {
      id: `pay-${Date.now()}`,
      fromId,
      toId,
      amount,
      date,
      note,
      status,
      proofType: 'note_statement',
      proofUrl: 'Verified client-side transfer receipt logged successfully.'
    };

    setPayments((prev) => [newPayment, ...prev]);
  };

  // Quick Settle Action from Settle Dashboard widget
  const handleQuickSettleOnDashboard = (fromId: string, toId: string, amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newSettle: PaymentActivity = {
      id: `pay-${Date.now()}`,
      fromId,
      toId,
      amount,
      date: today,
      note: 'Quick dashboard settle pay-back',
      status: 'completed', // Immediately completed to balance the books instantly
      proofType: 'receipt_slip',
      proofUrl: 'Direct offset settle-up record generated.'
    };

    setPayments((prev) => [newSettle, ...prev]);
  };

  const handleApprovePayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId ? { ...payment, status: 'completed' } : payment
      )
    );
  };

  const handleDeletePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  // Custom Navigation function
  const handleNavigate = (page: 'dashboard' | 'add-expense' | 'expense-summary' | 'payment-status') => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between">
      
      {/* Universal header */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentRoommate={currentRoommate}
        onLogout={handleLogout}
        activeGroup={activeGroup}
        reminders={reminders}
        onClearReminder={handleClearReminder}
        roommates={roommates}
      />

      {/* Pages Container with subtle transitions */}
      <main className="flex-grow">
        {currentPage === 'login' && (
          <LoginPage
            roommates={roommates}
            groups={groups}
            activeGroupId={activeGroupId}
            onSelectUser={handleSelectUser}
            onAddRoommate={handleRegisterRoommateAndLogin}
            onSelectGroup={handleSelectGroup}
          />
        )}

        {currentPage === 'dashboard' && currentRoommate && (
          <DashboardPage
            currentRoommate={currentRoommate}
            roommates={roommates}
            groups={groups}
            activeGroupId={activeGroupId}
            expenses={expenses}
            payments={payments}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
            onAddRoommateToActiveGroup={handleAddRoommateToActiveGroup}
            onQuickSettle={handleQuickSettleOnDashboard}
            onNavigate={handleNavigate}
            onSendReminder={handleSendReminder}
            onUpdateBankProfile={handleUpdateBankProfile}
          />
        )}

        {currentPage === 'add-expense' && currentRoommate && (
          <AddExpensePage
            currentRoommate={currentRoommate}
            roommates={roommates.filter((r) => activeGroup.roommateIds.includes(r.id))}
            onAddExpense={handleAddExpense}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'expense-summary' && currentRoommate && (
          <ExpenseSummaryPage
            expenses={expenses}
            roommates={roommates.filter((r) => activeGroup.roommateIds.includes(r.id))}
            onDeleteExpense={handleDeleteExpense}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'payment-status' && currentRoommate && (
          <PaymentStatusPage
            currentRoommate={currentRoommate}
            roommates={roommates.filter((r) => activeGroup.roommateIds.includes(r.id))}
            expenses={expenses}
            payments={payments}
            onAddPayment={handleAddPayment}
            onApprovePayment={handleApprovePayment}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </main>

      {/* Humble Elegant footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 select-none font-mono">
        <p>&copy; 2026 SplitMate Shared Household Ledger. Secured locally in active sandbox instance.</p>
        <p className="mt-1 text-[10px] text-slate-355">Precision split ratio accuracy: 100% equally distributed.</p>
      </footer>

    </div>
  );
}
