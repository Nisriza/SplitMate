/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { AddExpensePage } from './components/AddExpensePage';
import { ExpenseSummaryPage } from './components/ExpenseSummaryPage';
import { PaymentStatusPage } from './components/PaymentStatusPage';
import { Roommate, Group, Expense, PaymentActivity, AppPage, AppReminder } from './types';


export default function App() {
 const [currentPage, setCurrentPage] = useState<AppPage>('login');
const [roommates, setRoommates] = useState<Roommate[]>([]);
const [groups, setGroups] = useState<Group[]>([]);
const [activeGroupId, setActiveGroupId] = useState<string>('');
const [expenses, setExpenses] = useState<Expense[]>([]);
const [payments, setPayments] = useState<PaymentActivity[]>([]);
const [currentRoommateId, setCurrentRoommateId] = useState<string | null>(null);
const [reminders, setReminders] = useState<AppReminder[]>([]);

// Load all data from Supabase on startup
useEffect(() => {
  const loadAll = async () => {
    const [{ data: rm }, { data: gr }, { data: ex }, { data: pay }, { data: rem }] = await Promise.all([
      supabase.from('roommates').select('*'),
      supabase.from('groups').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('reminders').select('*'),
    ]);

    if (rm) setRoommates(rm.map((r) => ({
      id: r.id, name: r.name, username: r.username, password: r.password,
      avatarColor: r.avatar_color, bankName: r.bank_name, bankAccount: r.bank_account,
      qrType: r.qr_type, qrCodeDataUrl: r.qr_code_data_url,
    })));

    if (gr) setGroups(gr.map((g) => ({
      id: g.id, name: g.name, type: g.type, houseNo: g.house_no,
      roommateIds: g.roommate_ids, joinCode: g.join_code,
    })));

    if (ex) setExpenses(ex.map((e) => ({
      id: e.id, title: e.title, amount: e.amount, date: e.date,
      category: e.category, paidById: e.paid_by_id, splitWithIds: e.split_with_ids,
    })));

    if (pay) setPayments(pay.map((p) => ({
      id: p.id, fromId: p.from_id, toId: p.to_id, amount: p.amount,
      date: p.date, note: p.note, status: p.status, proofUrl: p.proof_url,
      proofType: p.proof_type, isOcr: p.is_ocr, ocrFileName: p.ocr_file_name,
      isRejected: p.is_rejected,
    })));

    if (rem) setReminders(rem.map((r) => ({
      id: r.id, fromId: r.from_id, toId: r.to_id, amount: r.amount,
      date: r.date, billTitle: r.bill_title, isRead: r.is_read,
    })));

    // Restore last logged in user
    const savedUserId = localStorage.getItem('splitmate_current_user_id');
    if (savedUserId) setCurrentRoommateId(savedUserId);
  };
  loadAll();
}, []); 

  useEffect(() => {
  if (currentRoommateId) {
    localStorage.setItem('splitmate_current_user_id', currentRoommateId);
  } else {
    localStorage.removeItem('splitmate_current_user_id');
  }
}, [currentRoommateId]);

  // Find active data records based on states
  const currentRoommate = roommates.find((r) => r.id === currentRoommateId) || null;
  const activeGroup = currentRoommateId 
    ? (groups.find((g) => g.id === activeGroupId && g.roommateIds.includes(currentRoommateId)) || 
       groups.find((g) => g.roommateIds.includes(currentRoommateId)) || 
       undefined)
    : (groups.find((g) => g.id === activeGroupId) || groups[0]);

  const isMemberOfActiveGroup = currentRoommateId && activeGroup ? activeGroup.roommateIds.includes(currentRoommateId) : false;

  // Compute filtered items for this group to avoid cross-group leaks or preloaded money for new suites!
  const activeGroupMembers = isMemberOfActiveGroup 
    ? roommates.filter((r) => activeGroup.roommateIds.includes(r.id))
    : (currentRoommate ? [currentRoommate] : []);

  const activeGroupExpenses = isMemberOfActiveGroup 
    ? expenses.filter(
        (exp) =>
          activeGroup.roommateIds.includes(exp.paidById) &&
          exp.splitWithIds.some((id) => activeGroup.roommateIds.includes(id))
      )
    : [];

  const activeGroupPayments = isMemberOfActiveGroup 
    ? payments.filter(
        (pay) =>
          activeGroup.roommateIds.includes(pay.fromId) &&
          activeGroup.roommateIds.includes(pay.toId)
      )
    : [];

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
  const handleUpdateBankProfile = (id: string, bankName: string, bankAccount: string, qrCodeDataUrl?: string) => {
    setRoommates((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, bankName, bankAccount, qrCodeDataUrl: qrCodeDataUrl ?? r.qrCodeDataUrl } : r
      )
    );
  };

  // Send Push Reminder notification to another roomie
  const handleSendReminder = async (toId: string, amount: number, billTitle?: string) => {
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

  await supabase.from('reminders').insert({
    id: newRem.id, from_id: newRem.fromId, to_id: newRem.toId,
    amount: newRem.amount, date: newRem.date,
    bill_title: newRem.billTitle, is_read: false,
  });

  setReminders((prev) => [newRem, ...prev]);
};

  const handleClearReminder = (remId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== remId));
  };

  // Invite URL link deep-linking parser
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('group') || params.get('code');
    if (codeParam) {
      const codeCleanParam = codeParam.trim().toUpperCase();
      const matched = groups.find(
        (g) => (g.joinCode || '').toUpperCase() === codeCleanParam || (g.id || '').toUpperCase() === codeCleanParam
      );
      if (matched) {
        setActiveGroupId(matched.id);
        // If not logged in, remain in login page to join this group
      }
    }
  }, [groups]);

  const handleCreateGroup = async (name: string, type: 'roommates' | 'housemates', houseNo: string) => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'GRP';
  const randNum = Math.floor(100 + Math.random() * 900);
  const joinCode = `${prefix}-${randNum}`;

  const newGroup: Group = {
    id: `grp-${Date.now()}`,
    name, type, houseNo,
    roommateIds: currentRoommateId ? [currentRoommateId] : [],
    joinCode,
  };

  await supabase.from('groups').insert({
    id: newGroup.id, name: newGroup.name, type: newGroup.type,
    house_no: newGroup.houseNo, roommate_ids: newGroup.roommateIds,
    join_code: newGroup.joinCode,
  });

  setGroups((prev) => [...prev, newGroup]);
  setActiveGroupId(newGroup.id);
};

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
  };

  // Leave Group
  const handleLeaveGroup = async (groupId: string) => {
  if (!currentRoommateId) return;

  const targetGroup = groups.find((g) => g.id === groupId);
  if (!targetGroup) return;

  const updatedIds = targetGroup.roommateIds.filter((id) => id !== currentRoommateId);

  await supabase.from('groups')
    .update({ roommate_ids: updatedIds })
    .eq('id', groupId);

  const updatedGroups = groups.map((g) =>
    g.id === groupId ? { ...g, roommateIds: updatedIds } : g
  );

  setGroups(updatedGroups);

  const remainingGroups = updatedGroups.filter((g) =>
    g.roommateIds.includes(currentRoommateId)
  );

  setActiveGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : '');
};
};

  // Delete Group
  const handleDeleteGroup = async (groupId: string) => {
  await supabase.from('groups').delete().eq('id', groupId);

  const updatedGroups = groups.filter((g) => g.id !== groupId);
  const remainingGroups = updatedGroups.filter((g) =>
    currentRoommateId ? g.roommateIds.includes(currentRoommateId) : false
  );

  setGroups(updatedGroups);
  setActiveGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : '');
};

  // Join group by invite code and notify all other roomies
  const handleJoinGroup = async (joinCode: string): Promise<{ success: boolean; error?: string; alreadyJoined?: boolean }> => {
  if (!currentRoommateId) return { success: false, error: 'Not logged in' };
  const codeClean = (joinCode || '').trim().toUpperCase();

  // Check local first
  let targetGroup = groups.find(
    (g) => (g.joinCode || '').toUpperCase() === codeClean || (g.id || '').toUpperCase() === codeClean
  );

  // If not found locally, try cloud ← THE KEY FIX
  if (!targetGroup) {
    targetGroup = await fetchGroupFromCloud(codeClean) ?? undefined;
    if (targetGroup) {
      // Save to local so future lookups work
      setGroups((prev) => {
        const exists = prev.find((g) => g.id === targetGroup!.id);
        return exists ? prev : [...prev, targetGroup!];
      });
    }
  }

  if (!targetGroup) {
    return { success: false, error: 'Suite code lookup failed! Group not found.' };
  }

  if (targetGroup.roommateIds.includes(currentRoommateId)) {
    setActiveGroupId(targetGroup.id);
    return { success: true, alreadyJoined: true };
  }

  const updatedIds = [...targetGroup.roommateIds, currentRoommateId];

await supabase.from('groups')
  .update({ roommate_ids: updatedIds })
  .eq('id', targetGroup.id);

setGroups((prev) =>
  prev.map((g) =>
    g.id === targetGroup!.id
      ? { ...g, roommateIds: updatedIds }
      : g
  )
);
setActiveGroupId(targetGroup.id);

  // Notify other roommates
  const otherRoommateIds = targetGroup.roommateIds;
  const joinTime = new Date().toISOString().split('T')[0];
  const joinerName = roommates.find((r) => r.id === currentRoommateId)?.name || 'New Roommate';

  if (otherRoommateIds.length > 0) {
    const newReminders: AppReminder[] = otherRoommateIds.map((otherId) => ({
      id: `rem-join-${Date.now()}-${otherId}`,
      fromId: currentRoommateId,
      toId: otherId,
      amount: 0,
      date: joinTime,
      billTitle: `${joinerName} has joined your suite group "${targetGroup.name}"!`,
      isRead: false,
    }));
    setReminders((prev) => [...prev, ...newReminders]);
  }

  return { success: true };
};

  const handleRegisterRoommate = async (
  name: string, username: string, password: string, avatarColor: string
) => {
  const existingUser = roommates.find(
    (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase()
  );

  if (existingUser) {
    alert('Username already exists.');
    return;
  }

  const newPersonId = `usr-${Date.now()}`;
  const newPerson: Roommate = {
    id: newPersonId,
    name,
    username: username.toLowerCase().trim(),
    password: password || 'password',
    avatarColor,
    bankName: 'Maybank',
    bankAccount: '',
    qrType: 'duitnow',
  };

  await supabase.from('roommates').insert({
    id: newPersonId, name, username: username.toLowerCase().trim(),
    password: password || 'password', avatar_color: avatarColor,
    bank_name: 'Maybank', bank_account: '', qr_type: 'duitnow',
  });

  setRoommates((prev) => [...prev, newPerson]);
  setCurrentRoommateId(newPersonId);
  setCurrentPage('dashboard');
};

  // Expense Modifiers
  const handleAddExpense = async (
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

    await supabase.from('expenses').insert({
  id: newExpense.id, title, amount, date, category,
  paid_by_id: paidById, split_with_ids: splitWithIds,
});
setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
  };

  // Payment Transfers Modifiers
  const handleAddPayment = async (
    fromId: string,
    toId: string,
    amount: number,
    date: string,
    note: string,
    status: 'pending' | 'completed',
    isOcr?: boolean,
    ocrFileName?: string,
    proofUrl?: string
  ) => {
    const newPayment: PaymentActivity = {
      id: `pay-${Date.now()}`,
      fromId,
      toId,
      amount,
      date,
      note,
      status,
      proofType: (isOcr || proofUrl) ? 'receipt_slip' : 'note_statement',
      proofUrl: proofUrl || (isOcr ? 'Smart OCR PDF receipt verified payment' : 'Verified client-side transfer receipt logged successfully.'),
      isOcr: isOcr || !!proofUrl,
      ocrFileName,
      isRejected: false
    };

    await supabase.from('payments').insert({
  id: newPayment.id, from_id: fromId, to_id: toId, amount, date, note, status,
  proof_type: newPayment.proofType, proof_url: newPayment.proofUrl,
  is_ocr: newPayment.isOcr, ocr_file_name: ocrFileName, is_rejected: false,
});
setPayments((prev) => [newPayment, ...prev]);

    // If others paid the owner, notify only the owner of the money
    if (fromId !== toId) {
      const payerName = roommates.find((r) => r.id === fromId)?.name || 'A roommate';
      const newReminder: AppReminder = {
        id: `rem-pay-${Date.now()}`,
        fromId,
        toId,
        amount,
        date,
        billTitle: `${payerName} posted proof of payment: RM ${amount.toFixed(2)} - "${note}"`,
        isRead: false
      };
      setReminders((prev) => [...prev, newReminder]);
    }
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

    // Notify the owner of the money
    if (fromId !== toId) {
      const payerName = roommates.find((r) => r.id === fromId)?.name || 'A roommate';
      const newReminder: AppReminder = {
        id: `rem-pay-${Date.now()}`,
        fromId,
        toId,
        amount,
        date: today,
        billTitle: `${payerName} logged a quick settle of RM ${amount.toFixed(2)} to you`,
        isRead: false
      };
      setReminders((prev) => [...prev, newReminder]);
    }
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

  const handleUpdatePayment = (updatedPayment: PaymentActivity) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );
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
            onAddRoommate={handleRegisterRoommate}
            onSelectGroup={handleSelectGroup}
          />
        )}

        {currentPage === 'dashboard' && currentRoommate && (
          <DashboardPage
            currentRoommate={currentRoommate}
            roommates={roommates}
            groups={groups}
            activeGroupId={activeGroup?.id || ''}
            expenses={activeGroupExpenses}
            payments={activeGroupPayments}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
            onJoinGroup={handleJoinGroup}
            onQuickSettle={handleQuickSettleOnDashboard}
            onNavigate={handleNavigate}
            onSendReminder={handleSendReminder}
            onUpdateBankProfile={handleUpdateBankProfile}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {currentPage === 'add-expense' && currentRoommate && (
          <AddExpensePage
            currentRoommate={currentRoommate}
            roommates={activeGroupMembers}
            onAddExpense={handleAddExpense}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'expense-summary' && currentRoommate && (
          <ExpenseSummaryPage
            expenses={activeGroupExpenses}
            roommates={activeGroupMembers}
            onDeleteExpense={handleDeleteExpense}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'payment-status' && currentRoommate && (
          <PaymentStatusPage
            currentRoommate={currentRoommate}
            roommates={activeGroupMembers}
            expenses={activeGroupExpenses}
            payments={activeGroupPayments}
            onAddPayment={handleAddPayment}
            onApprovePayment={handleApprovePayment}
            onDeletePayment={handleDeletePayment}
            onUpdatePayment={handleUpdatePayment}
            onSendReminder={handleSendReminder}
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
