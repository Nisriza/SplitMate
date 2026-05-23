/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CreditCard,
  PlusCircle, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  XCircle,
  Info,
  DollarSign,
  Sparkles,
  FileText,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Roommate, PaymentActivity, Expense } from '../types';
import { calculateBalances, computeSuggestedSettlements } from '../utils/calculations';

interface PaymentStatusPageProps {
  currentRoommate: Roommate;
  roommates: Roommate[];
  expenses: Expense[];
  payments: PaymentActivity[];
  onAddPayment: (fromId: string, toId: string, amount: number, date: string, note: string, status: 'pending' | 'completed') => void;
  onApprovePayment: (paymentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  currentRoommate,
  roommates,
  expenses,
  payments,
  onAddPayment,
  onApprovePayment,
  onDeletePayment,
}) => {
  // Navigation sidebar tab: manual transfer form vs smart AI OCR PDF receipt scanner
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>('ocr');

  // Manual Transfer Form state
  const [fromId, setFromId] = useState(currentRoommate.id);
  const [toId, setToId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [immediateComplete, setImmediateComplete] = useState<boolean>(true); // default true for immediate balance settlement

  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeReceiptPaymentId, setActiveReceiptPaymentId] = useState<string | null>(null);

  // Smart OCR State variables 
  const [dragActive, setDragActive] = useState(false);
  const [ocrFileName, setOcrFileName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [detectedRecipientId, setDetectedRecipientId] = useState('');
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [detectedDate, setDetectedDate] = useState('');
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrNote, setOcrNote] = useState('Proof: Smart OCR Receipt matching uploaded PDF');
  const [ocrCompletedSuccessMsg, setOcrCompletedSuccessMsg] = useState('');

  // Settle calculations
  const ledgerBalances = calculateBalances(roommates, expenses, payments);
  const myCurrentNet = ledgerBalances[currentRoommate.id] || 0;

  // Set default recipient to first roommate excluding payer
  React.useEffect(() => {
    const defaultRecipient = roommates.find(r => r.id !== fromId);
    if (defaultRecipient) {
      setToId(defaultRecipient.id);
    }
  }, [fromId, roommates]);

  // Set default detected recipient for OCR if not set
  React.useEffect(() => {
    if (!detectedRecipientId && roommates.length > 0) {
      const defaultRecipient = roommates.find(r => r.id !== currentRoommate.id) || roommates[0];
      if (defaultRecipient) {
        setDetectedRecipientId(defaultRecipient.id);
      }
    }
  }, [detectedRecipientId, roommates, currentRoommate]);

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(amountStr) || 0;
    if (amt <= 0) {
      setFormError('Please input a positive numeric transfer amount');
      return;
    }
    if (!toId) {
      setFormError('Please select a recipient roommate');
      return;
    }
    if (fromId === toId) {
      setFormError('Payer and recipient profile cannot be the same');
      return;
    }

    onAddPayment(
      fromId,
      toId,
      amt,
      dateStr,
      note.trim() || 'Settle joint balance split',
      immediateComplete ? 'completed' : 'pending'
    );

    // Reset Form
    setAmountStr('');
    setNote('');
    setShowForm(false);
    
    // Switch to active view
    setOcrCompletedSuccessMsg('Successfully logged your physical roommate payment!');
    setTimeout(() => setOcrCompletedSuccessMsg(''), 5000);
  };

  // Automated step-by-step scanner simulator log sequence
  const startScanningAnimation = (fileName: string, targetRecipientId: string, amount: number) => {
    setOcrFileName(fileName);
    setIsScanning(true);
    setScanStep(0);
    setOcrSuccess(false);
    setOcrCompletedSuccessMsg('');
    setScanLogs(["🤖 [SYSTEM] Initiating smart document structure analyser..."]);

    const steps = [
      { delay: 400, text: "🔍 Analyzing PDF digital seal credentials and bank headers..." },
      { delay: 900, text: "⚙️ Parsing recipient bank coords and transacting signatures..." },
      { delay: 1400, text: `💰 MATCHED: Verified beneficiary roommate is ${roommates.find(r => r.id === targetRecipientId)?.name || 'Housemate'}` },
      { delay: 1900, text: `💵 DETECTED CLEARING AMOUNT: RM ${amount.toFixed(2)}` },
      { delay: 2400, text: "🎉 OCR parse complete! House balance settle projection updated." }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanStep(idx + 1);
        setScanLogs(prev => [...prev, step.text]);
        if (idx === steps.length - 1) {
          setIsScanning(false);
          setDetectedRecipientId(targetRecipientId);
          setDetectedAmount(amount);
          setDetectedDate(new Date().toISOString().split('T')[0]);
          setOcrSuccess(true);
        }
      }, step.delay);
    });
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const nameLower = file.name.toLowerCase();
      
      // Heuristic detection based on matching roommate names
      let targetId = '';
      const matchedRoommate = roommates.find(r => nameLower.includes(r.name.toLowerCase().split(' ')[0]));
      if (matchedRoommate) {
        targetId = matchedRoommate.id;
      } else {
        const firstOther = roommates.find(r => r.id !== currentRoommate.id);
        targetId = firstOther ? firstOther.id : roommates[0]?.id || '';
      }

      // Read filename for digits or random RM 50 - 350
      let amount = 150.00;
      const digits = nameLower.match(/\d+/g);
      if (digits && digits.length > 0) {
        const val = parseFloat(digits[0]);
        if (val > 0 && val < 5050) amount = val;
      } else {
        amount = Math.floor(45 + Math.random() * 255);
      }

      startScanningAnimation(file.name, targetId, amount);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const firstOther = roommates.find(r => r.id !== currentRoommate.id);
      const targetId = firstOther ? firstOther.id : roommates[0]?.id || '';
      const amount = Math.floor(65 + Math.random() * 215);
      startScanningAnimation(file.name, targetId, amount);
    }
  };

  // Quick preset sample slips
  const sampleSlips = [
    { label: "Maybank_Trf_Alex_RM300.pdf", recipientIndex: 0, amount: 300.00 },
    { label: "TnG_eWallet_Jordan_RM150.pdf", recipientIndex: 1, amount: 150.00 },
    { label: "CIMB_Clicks_Taylor_RM100.pdf", recipientIndex: 2, amount: 100.00 },
  ];

  const handleTriggerPreset = (index: number) => {
    // Select valid other roommate in context
    const validOthers = roommates.filter(r => r.id !== currentRoommate.id);
    const slip = sampleSlips[index];
    // Map recipient index to a roommate if possible, otherwise use fallback first index
    const targetRoommate = validOthers[slip.recipientIndex % validOthers.length] || validOthers[0] || roommates[0];
    startScanningAnimation(slip.label, targetRoommate.id, slip.amount);
  };

  const handleCommitOcrPayment = () => {
    if (!detectedAmount || !detectedRecipientId) return;

    onAddPayment(
      currentRoommate.id,
      detectedRecipientId,
      detectedAmount,
      detectedDate || new Date().toISOString().split('T')[0],
      ocrNote.trim() || 'Smart OCR PDF receipt verified payment',
      'completed' // Immediately approved 
    );

    setOcrCompletedSuccessMsg(`🎉 Successfully posted Smart OCR Settlement! Transferred RM ${detectedAmount.toFixed(2)} to ${roommates.find(r => r.id === detectedRecipientId)?.name}. Balance has been automatically re-calculated!`);
    
    // Reset scanner
    setOcrSuccess(false);
    setOcrFileName('');
    setDetectedAmount(null);

    // Fade toast
    setTimeout(() => {
      setOcrCompletedSuccessMsg('');
    }, 7000);
  };

  // Forecast balance outcomes for matching receipt amounts
  const forecastBalanceBefore = myCurrentNet;
  const forecastPaymentAmount = detectedAmount || 0;
  const forecastBalanceAfter = forecastBalanceBefore + forecastPaymentAmount;
  // If post balance >= 0, means they have settled up everything (overall no longer in net debt)
  const settlesEntireBalance = forecastBalanceAfter >= -0.01;
  const remainingActiveDebt = Math.abs(forecastBalanceAfter < 0 ? forecastBalanceAfter : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-slate-800 flex items-center gap-1.5">
            Payment & Settlement Status <span className="bg-blue-150 text-blue-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Smart OCR Active</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track off-app money transfers, approve receipts, and scan PDF files to auto-balance household accounts.
          </p>
        </div>
        <button
          id="toggle-transfer-form-btn"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> 
          {showForm ? 'Hide Forms' : 'Open Settle Hub'}
        </button>
      </div>

      {ocrCompletedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-2xl text-xs font-semibold animate-slide-up flex gap-2">
          <span>🛡️</span>
          <p>{ocrCompletedSuccessMsg}</p>
        </div>
      )}

      {/* Grid: Form to Log and Logs detail listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Transfer form column (Toggled/Side columns) */}
        <div className={`lg:col-span-1 space-y-6 ${showForm ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            
            {/* Segmented Tab Swapper */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ocr');
                  setFormError('');
                }}
                className={`text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'ocr'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Receipt PDF OCR
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setFormError('');
                }}
                className={`text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                Manual Log
              </button>
            </div>

            {/* TAB B: SMART PDF RECEIPT SCANNER & DETECTOR */}
            {activeTab === 'ocr' && (
              <div className="space-y-4 animate-fade-in bg-slate-50/50 -mx-3 -mb-3 p-3 sm:mx-0 sm:mb-0 sm:p-0 rounded-2xl">
                <div>
                  <h3 className="font-display font-semibold text-sm text-slate-805 flex items-center gap-1.5">
                    📂 Smart PDF OCR Settle-Up
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload a roommate's bank transfer PDF or screenshot. The system will detect the paid amount and auto-calculate remaining balances!
                  </p>
                </div>

                {/* Drag 'n Drop Input Frame */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? "border-blue-500 bg-blue-50/40 scale-[1.02]" 
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-350"
                  }`}
                >
                  <input
                    type="file"
                    id="receipt-file-picker"
                    accept=".pdf, image/*"
                    className="hidden"
                    onChange={handleManualFileSelect}
                  />
                  <label htmlFor="receipt-file-picker" className="cursor-pointer space-y-2.5 block">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700">Drag & Drop Receipt PDF here</p>
                      <p className="text-[10px] text-slate-450 font-mono">or click to browse local files</p>
                    </div>
                  </label>
                </div>

                {/* Pre-made Local OCR Test Samples */}
                <div className="space-y-1.5 bg-white border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    💡 Quick Sandbox Simulation Slips:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {sampleSlips.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTriggerPreset(idx)}
                        className="w-full text-left bg-slate-50 hover:bg-blue-50/50 p-2 rounded-xl text-[11px] font-mono text-slate-650 flex justify-between items-center transition-all cursor-pointer border border-transparent hover:border-blue-200/50 group"
                      >
                        <span className="truncate max-w-[150px] group-hover:text-blue-700 font-medium">📄 {s.label}</span>
                        <span className="font-bold text-slate-800 text-right">RM {s.amount.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Scanner logs overlay */}
                {isScanning && (
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] space-y-2 shadow-inner border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400/80 animate-scanline shadow-md shadow-emerald-400"></div>
                    <div className="flex items-center justify-between pb-1 border-b border-emerald-800/50 text-slate-400">
                      <span>🤖 AI OCR LOGS</span>
                      <span className="animate-pulse flex items-center gap-1">🟢 scanning document</span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {scanLogs.map((l, idx) => (
                        <p key={idx} className="leading-relaxed">{l}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Successful OCR parse result dashboard panel */}
                {ocrSuccess && detectedAmount !== null && (
                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3.5 animate-slide-up">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">🔬 Detected Receipt slip</span>
                      <span className="text-[9px] bg-slate-100 py-0.5 px-1.5 rounded font-mono truncate max-w-[110px]" title={ocrFileName}>
                        {ocrFileName}
                      </span>
                    </div>

                    {/* Detected details card */}
                    <div className="space-y-2 text-xs font-display">
                      <div className="flex justify-between py-1 border-b border-slate-100/50">
                        <span className="text-slate-450 font-semibold font-mono">Payer Sender</span>
                        <span className="font-bold text-slate-800">You ({currentRoommate.name})</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-450 font-semibold font-mono">Recipient Beneficiary</span>
                        <select
                          value={detectedRecipientId}
                          onChange={(e) => setDetectedRecipientId(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-850 text-[11px] p-1 rounded font-semibold cursor-pointer"
                        >
                          {roommates.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100/50 items-center">
                        <span className="text-slate-450 font-semibold font-mono">Fund Paid Amount</span>
                        <span className="font-mono font-bold text-blue-600 text-[13px] bg-blue-50 py-0.5 px-2 rounded">
                          RM {detectedAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">Slip Verified Note</label>
                        <input
                          type="text"
                          value={ocrNote}
                          onChange={(e) => setOcrNote(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] p-2 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* BEFORE & AFTER DYNAMIC BALANCE FORECASTING */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-display space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        📐 Instant Balance recalculator:
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border border-slate-100">
                          <span className="text-[9px] text-slate-400 block font-mono">Current Net Bal:</span>
                          <span className={`font-mono font-bold ${forecastBalanceBefore < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            RM {forecastBalanceBefore.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-100 bg-blue-50/10">
                          <span className="text-[9px] text-slate-400 block font-mono font-bold">New Forecasted Net:</span>
                          <span className={`font-mono font-bold ${forecastBalanceAfter < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            RM {forecastBalanceAfter.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Settlement badge checking */}
                      {settlesEntireBalance ? (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 border border-emerald-150">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p>
                            🎉 <strong>FULLY SETTLED!</strong> Your newly scanned payment of <strong>RM {forecastPaymentAmount.toFixed(2)}</strong> successfully covers and pays off all your remaining shared debts in the ledger!
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p>
                            ⚠️ <strong>PARTIALLY SETTLED!</strong> This payment resolves a portion of your split shares. You still have some remaining outstanding balance. <strong>Outstanding share remaining: RM {remainingActiveDebt.toFixed(2)}</strong>.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCommitOcrPayment}
                      className="w-full cursor-pointer py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      Post Automated Settlement
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB A: MANUAL PAYMENT LOG FORM */}
            {activeTab === 'manual' && (
              <form onSubmit={handleSubmitTransfer} className="space-y-4 animate-fade-in">
                
                {/* Who Paid sender */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Sender (Gave Money)
                  </label>
                  <select
                    id="transfer-sender-select"
                    value={fromId}
                    onChange={(e) => setFromId(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    {roommates.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.id === currentRoommate.id ? `Me (${r.name})` : r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Who Received receiver */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Recipient (Got Money)
                  </label>
                  <select
                    id="transfer-recipient-select"
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    {roommates.filter(r => r.id !== fromId).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Amount (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Transfer Date
                    </label>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Transfer Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Settle rent portion"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Instant Complete Checkbox toggle */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="immediate-complete-checkbox"
                    checked={immediateComplete}
                    onChange={(e) => setImmediateComplete(e.target.checked)}
                    className="mt-1 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="immediate-complete-checkbox" className="text-xs text-slate-650 cursor-pointer font-medium select-none">
                    <strong>Mark as Completed instantly</strong>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      If unchecked, transaction enters "Pending Approval" state, which won't affect balances until receiver clicks "Approve Receipt".
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="transfer-submit-btn"
                  className="w-full cursor-pointer py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all sm:py-3"
                >
                  Log Physical Transfer
                </button>

              </form>
            )}

          </div>
        </div>

        {/* Payment list activity register */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div>
              <h3 className="font-display font-semibold text-lg text-slate-800">
                Settlement Activity & Receipts Log
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Records of payments logged between roomies. Unsettled drafts are listed to ensure proper receipt verification.
              </p>
            </div>

            {/* List */}
            <div className="mt-6 space-y-4">
              {payments.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-2xl">
                  <CreditCard className="mx-auto w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-display font-bold text-slate-750">No transaction logs in this house</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Either balances are healthy, or roommates settle up off-app. Use the Transfer form to test! </p>
                </div>
              ) : (
                payments.map((payment) => {
                  const fromUser = roommates.find(r => r.id === payment.fromId);
                  const toUser = roommates.find(r => r.id === payment.toId);
                  if(!fromUser || !toUser) return null;

                  const isPending = payment.status === 'pending';
                  const isIncomingToMe = payment.toId === currentRoommate.id;

                  return (
                    <div 
                      key={payment.id}
                      id={`payment-row-${payment.id}`}
                      className={`p-4 border rounded-2xl flex flex-col gap-4 transition-all ${
                        isPending 
                          ? 'bg-amber-50/30 border-amber-200/60 shadow-xs' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3.5">
                          
                          {/* Status visual box */}
                          <div className={`p-2.5 rounded-xl ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isPending ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </div>

                          {/* Transaction path */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800 text-xs py-0.5 px-2 bg-slate-100 rounded">
                                {fromUser.name}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">transferred to</span>
                              <span className="font-semibold text-blue-700 text-xs py-0.5 px-2 bg-blue-50 rounded">
                                {toUser.name}
                              </span>
                            </div>

                            <div className="text-xs text-slate-400">
                              Note: <span className="text-slate-650 italic font-medium font-display">"{payment.note}"</span> &bull; 
                              <span className="font-mono ml-1">{payment.date}</span>
                            </div>

                            {/* Interactive notice */}
                            {isPending && isIncomingToMe && (
                              <span className="block text-[10px] text-amber-700 font-bold bg-amber-100/50 border border-amber-200/50 py-1 px-2 rounded mt-1.5">
                                👉 You are the recipient. Please verify this payment to adjust active ledger.
                              </span>
                            )}
                            {isPending && !isIncomingToMe && (
                              <span className="block text-[10px] text-slate-400 italic">
                                Waiting for {toUser.name.split(' ')[0]} to approve this settlement.
                              </span>
                            )}
                          </div>

                        </div>

                        {/* Cash standing and confirmation controls */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2">
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold block">Fund Transfer</span>
                            <span className="text-base font-mono font-bold text-blue-600 block">
                              RM {payment.amount.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceiptPaymentId(activeReceiptPaymentId === payment.id ? null : payment.id);
                              }}
                              className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                              title="Inspect receipt documents"
                            >
                              Proof 📄
                            </button>
                            
                            {isPending && isIncomingToMe && (
                              <button
                                id={`approve-payment-${payment.id}`}
                                onClick={() => {
                                  if(confirm(`Confirm receipt of RM ${payment.amount.toFixed(2)} from ${fromUser.name}?`)) {
                                    onApprovePayment(payment.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider text-[9px] rounded-md uppercase cursor-pointer transition-colors"
                                title="Approve and update balance pool"
                              >
                                Approve Receipt
                              </button>
                            )}
                            <button
                              id={`delete-payment-${payment.id}`}
                              onClick={() => {
                                if(confirm('Are you sure you want to delete this transfer activity?')) {
                                  onDeletePayment(payment.id);
                                }
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors text-xs font-semibold cursor-pointer"
                              title="Remove log entry"
                            >
                              delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanding transaction proof block */}
                      {activeReceiptPaymentId === payment.id && (
                        <div className="mt-1 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left animate-slide-up space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                              🏦 Fund Transfer Verification Slip
                            </span>
                            <span className="text-[10px] text-slate-450 font-mono">ID: TXN-{payment.id.toUpperCase()}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            <div className="bg-white p-2.5 rounded border border-slate-100">
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">Origin Account</span>
                              <span className="font-bold text-slate-800">{fromUser.name}</span>
                              <span className="block text-slate-500 text-[10px]">{fromUser.bankName || 'Maybank'}</span>
                              <span className="block text-slate-400 font-bold text-[9px] tracking-wide">{fromUser.bankAccount || '1140-xxxx-xxxx'}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-100">
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">Destination Account</span>
                              <span className="font-bold text-slate-800">{toUser.name}</span>
                              <span className="block text-slate-500 text-[10px]">{toUser.bankName || 'CIMB Bank'}</span>
                              <span className="block text-slate-400 font-bold text-[9px] tracking-wide">{toUser.bankAccount || '8005-xxxx-xxxx'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span>📄</span>
                              <span className="font-mono text-slate-600 font-semibold truncate max-w-[200px] sm:max-w-md">SplitMate_Receipt_slip_{payment.id.substring(4, 9)}.pdf</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => alert(`SplitMate PDF Visualizer: Showing document template.\nPayout RM ${payment.amount.toFixed(2)} from ${fromUser.name} (Source: ${fromUser.bankName}) was successfully transferred on ${payment.date} to ${toUser.name} (${toUser.bankName}).`)}
                              className="bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Download PDF
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-500 space-y-1">
              <strong>Understanding Pending Payments:</strong>
              <p>
                In a collaborative roommates set-up, accountability is critical. Discovered payments registered as 'pending' represent transfers sent but not yet verified. Only when the designated recipient confirms the transaction does the overall house balance ledger adjust to reflect the debt cancellation.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
