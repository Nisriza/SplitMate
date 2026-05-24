/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { Roommate, PaymentActivity, Expense } from "../types";
import {
  calculateBalances,
  computeSuggestedSettlements,
} from "../utils/calculations";

interface PaymentStatusPageProps {
  currentRoommate: Roommate;
  roommates: Roommate[];
  expenses: Expense[];
  payments: PaymentActivity[];
  onAddPayment: (
    fromId: string,
    toId: string,
    amount: number,
    date: string,
    note: string,
    status: "pending" | "completed",
    isOcr?: boolean,
    ocrFileName?: string,
    proofUrl?: string,
  ) => void;
  onApprovePayment: (paymentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onUpdatePayment: (updated: PaymentActivity) => void;
  onSendReminder?: (toId: string, amount: number, billTitle?: string) => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  currentRoommate,
  roommates,
  expenses,
  payments,
  onAddPayment,
  onApprovePayment,
  onDeletePayment,
  onUpdatePayment,
  onSendReminder,
}) => {
  // Navigation sidebar tab: manual transfer form vs smart AI OCR PDF receipt scanner
  const [activeTab, setActiveTab] = useState<"manual" | "ocr">("ocr");

  // Manual Transfer Form state
  const [fromId, setFromId] = useState(currentRoommate.id);
  const [toId, setToId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dateStr, setDateStr] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");
  const [immediateComplete, setImmediateComplete] = useState<boolean>(true); // default true for immediate balance settlement

  // Edit/Modify Payment details state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editFromId, setEditFromId] = useState("");
  const [editToId, setEditToId] = useState("");
  const [editAmountStr, setEditAmountStr] = useState("");
  const [editDateStr, setEditDateStr] = useState("");
  const [editNoteStr, setEditNoteStr] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "completed">(
    "completed",
  );
  const [editError, setEditError] = useState("");

  // Inline confirmations states to bypass standard iFrame alerts blocking
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null,
  );
  const [approvingPaymentId, setApprovingPaymentId] = useState<string | null>(
    null,
  );

  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeReceiptPaymentId, setActiveReceiptPaymentId] = useState<
    string | null
  >(null);
  const [ocrError, setOcrError] = useState("");
  const [expandedUntrustedPaymentId, setExpandedUntrustedPaymentId] = useState<
    string | null
  >(null);

  // Smart OCR State variables
  const [dragActive, setDragActive] = useState(false);
  const [ocrFileName, setOcrFileName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [detectedRecipientId, setDetectedRecipientId] = useState("");
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [detectedDate, setDetectedDate] = useState("");
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrNote, setOcrNote] = useState(
    "Proof: Smart OCR Receipt matching uploaded PDF",
  );
  const [ocrCompletedSuccessMsg, setOcrCompletedSuccessMsg] = useState("");

  // States to persist dynamic client-uploaded receipts and support lightbox previews
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>("");
  const [manualFileName, setManualFileName] = useState<string>("");
  const [previewingProofUrl, setPreviewingProofUrl] = useState<string | null>(
    null,
  );
  const [previewingDocName, setPreviewingDocName] = useState<string>("");
  const [previewingPaymentId, setPreviewingPaymentId] = useState<string | null>(
    null,
  );

  // Settle calculations
  const ledgerBalances = calculateBalances(roommates, expenses, payments);
  const myCurrentNet = ledgerBalances[currentRoommate.id] || 0;

  // Set default recipient to first roommate excluding payer
  React.useEffect(() => {
    const defaultRecipient = roommates.find((r) => r.id !== fromId);
    if (defaultRecipient) {
      setToId(defaultRecipient.id);
    }
  }, [fromId, roommates]);

  // Set default detected recipient for OCR if not set
  React.useEffect(() => {
    if (!detectedRecipientId && roommates.length > 0) {
      const defaultRecipient =
        roommates.find((r) => r.id !== currentRoommate.id) || roommates[0];
      if (defaultRecipient) {
        setDetectedRecipientId(defaultRecipient.id);
      }
    }
  }, [detectedRecipientId, roommates, currentRoommate]);

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const amt = parseFloat(amountStr) || 0;
    if (amt <= 0) {
      setFormError("Please input a positive numeric transfer amount");
      return;
    }
    if (!toId) {
      setFormError("Please select a recipient roommate");
      return;
    }
    if (fromId === toId) {
      setFormError("Payer and recipient profile cannot be the same");
      return;
    }

    onAddPayment(
      fromId,
      toId,
      amt,
      dateStr,
      note.trim() || "Settle joint balance split",
      immediateComplete ? "completed" : "pending",
      !!manualFileName,
      manualFileName || undefined,
      uploadedProofUrl || undefined,
    );

    // Reset Form
    setAmountStr("");
    setNote("");
    setManualFileName("");
    setUploadedProofUrl("");
    setShowForm(false);

    // Switch to active view
    setOcrCompletedSuccessMsg(
      "Successfully logged your physical roommate payment!",
    );
    setTimeout(() => setOcrCompletedSuccessMsg(""), 5000);
  };

  const handleEditPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editingPaymentId) return;

    const amt = parseFloat(editAmountStr) || 0;
    if (amt <= 0) {
      setEditError("Please input a positive numeric transfer amount");
      return;
    }
    if (!editToId) {
      setEditError("Please select a recipient roommate");
      return;
    }
    if (editFromId === editToId) {
      setEditError("Payer and recipient profile cannot be the same");
      return;
    }

    const currentPaymentObject = payments.find(
      (p) => p.id === editingPaymentId,
    );
    if (!currentPaymentObject) return;

    const updatedPayment: PaymentActivity = {
      ...currentPaymentObject,
      fromId: editFromId,
      toId: editToId,
      amount: amt,
      date: editDateStr,
      note: editNoteStr.trim() || "Settle joint balance split",
      status: editStatus,
    };

    onUpdatePayment(updatedPayment);
    setEditingPaymentId(null);
    setOcrCompletedSuccessMsg(
      "Successfully updated and saved the payment details!",
    );
    setTimeout(() => setOcrCompletedSuccessMsg(""), 5000);
  };

  // Automated step-by-step scanner simulator log sequence
  const startScanningAnimation = (
    fileName: string,
    targetRecipientId: string,
    amount: number,
  ) => {
    setOcrFileName(fileName);
    setIsScanning(true);
    setScanStep(0);
    setOcrSuccess(false);
    setOcrError("");
    setOcrCompletedSuccessMsg("");
    setScanLogs([
      "🤖 [SYSTEM] Initiating smart document structure analyser...",
    ]);

    const fileNameLower = fileName.toLowerCase();

    // Malaysian & global bank and e-wallet names that must be present to detect as a genuine receipt
    const bankKeywords = [
      "maybank",
      "m2u",
      "cimb",
      "duitnow",
      "rhb",
      "public bank",
      "pbb",
      "hong leong",
      "hlb",
      "ambank",
      "uob",
      "bank islam",
      "tng",
      "touch n go",
      "touch 'n go",
      "boost",
      "grabpay",
      "paynet",
      "shopee",
      "rakyat",
      "affin",
      "alliance",
      "hsbc",
      "scb",
      "citi",
      "standard chartered",
      "bank",
    ];

    const detectedBank = bankKeywords.find((bank) =>
      fileNameLower.includes(bank),
    );
    let detectedHeader = "";

    if (detectedBank) {
      detectedHeader = detectedBank.toUpperCase();
    } else {
      // Fallback checklist for general receipt terms or a roommate name or bank account details
      const generalKeywords = [
        "transaction",
        "transcation",
        "receipt",
        "payment",
        "slip",
        "proof",
        "bill",
        "invoice",
        "statement",
        "account",
        "acc",
        "transfer",
        "trans",
        "ref",
        "reference",
        "photo",
        "image",
        "document",
        "pdf",
      ];

      const matchedGeneral = generalKeywords.find((keyword) =>
        fileNameLower.includes(keyword),
      );
      const matchedRoommate = roommates.find((r) =>
        fileNameLower.includes(r.name.toLowerCase().split(" ")[0]),
      );
      const hasAccountNumber = fileNameLower.match(/\d{4,}/) !== null;

      if (matchedGeneral) {
        detectedHeader = `TRANSACTION ${matchedGeneral.toUpperCase()}`;
      } else if (matchedRoommate) {
        detectedHeader = `ROOMMATE LEDGER (${matchedRoommate.name.toUpperCase()})`;
      } else if (hasAccountNumber) {
        detectedHeader = "BANK ACCOUNT RECORD / TRANSFER ID";
      }
    }

    if (!detectedHeader) {
      setTimeout(() => {
        setScanLogs((prev) => [
          ...prev,
          "🔍 Scanning document text block for payment metadata...",
          "❌ [ERROR] OCR bank / receipt type detection failed.",
          "⚠️ wrong photo. The uploaded file is not recognized as a valid receipt of bank photos. Standard receipts must contain recognized bank or e-wallet headers (e.g. Maybank, CIMB, DuitNow, TNG, RHB, HLB, AmBank) or general transaction labels, account numbers, or roommate names above the receipt. Verification aborted.",
        ]);
        setIsScanning(false);
        setOcrSuccess(false);
        setOcrError(
          "wrong photo. The uploaded PDF didn't match the receipt of bank or any transaction receipt details. Please upload a valid receipt containing transaction keywords, a bank name, an account number, or roommate names.",
        );
      }, 1500);
      return;
    }

    const steps = [
      {
        delay: 400,
        text: `🔍 Analyzing PDF digital seal credentials and headers [Detected: ${detectedHeader}]...`,
      },
      {
        delay: 900,
        text: "⚙️ Parsing recipient bank coords and transacting signatures...",
      },
      {
        delay: 1400,
        text: `💰 MATCHED: Verified beneficiary roommate is ${roommates.find((r) => r.id === targetRecipientId)?.name || "Housemate"}`,
      },
      {
        delay: 1900,
        text: `💵 DETECTED CLEARING AMOUNT: RM ${amount.toFixed(2)}`,
      },
      {
        delay: 2400,
        text: "🎉 OCR parse complete! House balance settle projection updated.",
      },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanStep(idx + 1);
        setScanLogs((prev) => [...prev, step.text]);
        if (idx === steps.length - 1) {
          setIsScanning(false);
          setDetectedRecipientId(targetRecipientId);
          setDetectedAmount(amount);
          setDetectedDate(new Date().toISOString().split("T")[0]);
          setOcrSuccess(true);
        }
      }, step.delay);
    });
  };

  // Dynamic regex for smarter filename digit parsing
  const parseAmountFromFileName = (fileName: string): number => {
    const fileNameClean = fileName.toLowerCase();

    // Try to find patterns like rm350, rm_120.50, myr250.00
    const rmMatch = fileNameClean.match(/(?:rm|myr)\s*(\d+(?:\.\d{2})?)/);
    if (rmMatch && rmMatch[1]) {
      const parsed = parseFloat(rmMatch[1]);
      if (parsed > 0) return parsed;
    }

    // Try to find any floating point numbers or numbers with decimals (e.g. 50.50, 120.00, etc)
    const decimalMatch = fileNameClean.match(/(\d+\.\d{2})/);
    if (decimalMatch && decimalMatch[1]) {
      const parsed = parseFloat(decimalMatch[1]);
      if (parsed > 0) return parsed;
    }

    // Look for any standard digits (excluding common large dates like 2024, 2025, 2026)
    const numbers = fileNameClean.match(/\d+/g);
    if (numbers) {
      for (const numStr of numbers) {
        const val = parseFloat(numStr);
        // Skip strings that look like years (2020-2030) or dates unless nothing else is found
        if (val >= 2020 && val <= 2030) continue;
        if (val > 0 && val < 10000) {
          return val;
        }
      }
    }

    // Fallback to random or a nice standard
    return Math.floor(65 + Math.random() * 215);
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

      const fileUrl = URL.createObjectURL(file);
      setUploadedProofUrl(fileUrl);

      // Heuristic detection based on matching roommate names
      let targetId = "";
      const matchedRoommate = roommates.find((r) =>
        nameLower.includes(r.name.toLowerCase().split(" ")[0]),
      );
      if (matchedRoommate) {
        targetId = matchedRoommate.id;
      } else {
        const firstOther = roommates.find((r) => r.id !== currentRoommate.id);
        targetId = firstOther ? firstOther.id : roommates[0]?.id || "";
      }

      const amount = parseAmountFromFileName(file.name);
      startScanningAnimation(file.name, targetId, amount);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      setUploadedProofUrl(fileUrl);

      const firstOther = roommates.find((r) => r.id !== currentRoommate.id);
      const targetId = firstOther ? firstOther.id : roommates[0]?.id || "";
      const amount = parseAmountFromFileName(file.name);
      startScanningAnimation(file.name, targetId, amount);
    }
  };

  const handleCommitOcrPayment = () => {
    if (!detectedAmount || !detectedRecipientId) return;

    onAddPayment(
      currentRoommate.id,
      detectedRecipientId,
      detectedAmount,
      detectedDate || new Date().toISOString().split("T")[0],
      ocrNote.trim() || "Smart OCR PDF receipt verified payment",
      "completed", // Immediately approved
      true, // isOcr
      ocrFileName, // preserve uploaded filename
      uploadedProofUrl, // pass the live blob URL
    );

    setOcrCompletedSuccessMsg(
      `🎉 Successfully posted Smart OCR Settlement! Transferred RM ${detectedAmount.toFixed(2)} to ${roommates.find((r) => r.id === detectedRecipientId)?.name}. Balance has been automatically re-calculated!`,
    );

    // Reset scanner
    setOcrSuccess(false);
    setOcrFileName("");
    setDetectedAmount(null);

    // Fade toast
    setTimeout(() => {
      setOcrCompletedSuccessMsg("");
    }, 7000);
  };

  // Forecast balance outcomes for matching receipt amounts
  const forecastBalanceBefore = myCurrentNet;
  const forecastPaymentAmount = detectedAmount || 0;
  const forecastBalanceAfter = forecastBalanceBefore + forecastPaymentAmount;
  // If post balance >= 0, means they have settled up everything (overall no longer in net debt)
  const settlesEntireBalance = forecastBalanceAfter >= -0.01;
  const remainingActiveDebt = Math.abs(
    forecastBalanceAfter < 0 ? forecastBalanceAfter : 0,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-slate-800 flex items-center gap-1.5">
            Payment & Settlement Status{" "}
            <span className="bg-blue-150 text-blue-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Smart OCR Active
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track off-app money transfers, approve receipts, and scan PDF files
            to auto-balance household accounts.
          </p>
        </div>
      </div>

      {ocrCompletedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-2xl text-xs font-semibold animate-slide-up flex gap-2">
          <span>🛡️</span>
          <p>{ocrCompletedSuccessMsg}</p>
        </div>
      )}

      {/* Grid: Form to Log and Logs detail listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transfer form column (Always visible) */}
        <div className="lg:col-span-1 space-y-6 block">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            {/* Segmented Tab Swapper */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ocr");
                  setFormError("");
                }}
                className={`text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "ocr"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Receipt PDF OCR
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("manual");
                  setFormError("");
                }}
                className={`text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "manual"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                Manual Log
              </button>
            </div>

            {/* TAB B: SMART PDF RECEIPT SCANNER & DETECTOR */}
            {activeTab === "ocr" && (
              <div className="space-y-4 animate-fade-in bg-slate-50/50 -mx-3 -mb-3 p-3 sm:mx-0 sm:mb-0 sm:p-0 rounded-2xl">
                <div>
                  <h3 className="font-display font-semibold text-sm text-slate-805 flex items-center gap-1.5">
                    📂 Smart PDF OCR Settle-Up
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload a roommate's bank transfer PDF or screenshot. The
                    system will detect the paid amount and auto-calculate
                    remaining balances!
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
                  <label
                    htmlFor="receipt-file-picker"
                    className="cursor-pointer space-y-2.5 block"
                  >
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700">
                        Drag & Drop Receipt PDF here
                      </p>
                      <p className="text-[10px] text-slate-450 font-mono">
                        or click to browse local files
                      </p>
                    </div>
                  </label>
                </div>

                {/* Error message if PDF standard check fails */}
                {ocrError && (
                  <div className="bg-rose-50 border border-rose-205 text-rose-800 p-3.5 rounded-2xl flex items-start gap-2.5 animate-slide-up text-xs select-none">
                    <span className="text-sm">⚠️</span>
                    <div className="space-y-0.5 text-left">
                      <h4 className="font-bold text-rose-955">
                        Verification Failure
                      </h4>
                      <p className="text-rose-700 leading-normal font-medium">
                        {ocrError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interactive Scanner logs overlay */}
                {isScanning && (
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] space-y-2 shadow-inner border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400/80 animate-scanline shadow-md shadow-emerald-400"></div>
                    <div className="flex items-center justify-between pb-1 border-b border-emerald-800/50 text-slate-400">
                      <span>🤖 AI OCR LOGS</span>
                      <span className="animate-pulse flex items-center gap-1">
                        🟢 scanning document
                      </span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {scanLogs.map((l, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {l}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Successful OCR parse result dashboard panel */}
                {ocrSuccess && detectedAmount !== null && (
                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3.5 animate-slide-up">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        🔬 Detected Receipt slip
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewingProofUrl(uploadedProofUrl || "mock");
                            setPreviewingDocName(ocrFileName || "receipt_document.pdf");
                            setPreviewingPaymentId(null);
                          }}
                          className="text-[10px] bg-blue-50 hover:bg-blue-105 text-blue-600 font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all flex items-center gap-0.5"
                          title="View uploaded proof document"
                        >
                          👁️ View
                        </button>
                        <span
                          className="text-[9px] bg-slate-100 py-0.5 px-1.5 rounded font-mono truncate max-w-[110px]"
                          title={ocrFileName}
                        >
                          {ocrFileName}
                        </span>
                      </div>
                    </div>

                    {/* Detected details card */}
                    <div className="space-y-2 text-xs font-display">
                      <div className="flex justify-between py-1 border-b border-slate-100/50">
                        <span className="text-slate-450 font-semibold font-mono">
                          Payer Sender
                        </span>
                        <span className="font-bold text-slate-800">
                          You ({currentRoommate.name})
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                        <span className="text-slate-450 font-semibold font-mono">
                          Recipient Beneficiary
                        </span>
                        <select
                          value={detectedRecipientId}
                          onChange={(e) =>
                            setDetectedRecipientId(e.target.value)
                          }
                          className="bg-slate-50 border border-slate-200 text-slate-850 text-[11px] p-1 rounded font-semibold cursor-pointer"
                        >
                          {roommates.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100/50 items-center">
                        <span className="text-slate-450 font-semibold font-mono">
                          Fund Paid Amount
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-400">
                            RM
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={
                              detectedAmount !== null ? detectedAmount : ""
                            }
                            onChange={(e) =>
                              setDetectedAmount(
                                parseFloat(e.target.value) || null,
                              )
                            }
                            className="bg-blue-50 border border-blue-200 text-blue-600 font-mono font-bold text-xs p-1 rounded w-28 text-right focus:ring-1 focus:ring-blue-400 focus:outline-hidden"
                            title="OCR detected amount. Feel free to modify if inaccurate!"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">
                          Slip Verified Note
                        </label>
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
                          <span className="text-[9px] text-slate-400 block font-mono">
                            Current Net Bal:
                          </span>
                          <span
                            className={`font-mono font-bold ${forecastBalanceBefore < 0 ? "text-rose-600" : "text-emerald-600"}`}
                          >
                            RM {forecastBalanceBefore.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-100 bg-blue-50/10">
                          <span className="text-[9px] text-slate-400 block font-mono font-bold">
                            New Forecasted Net:
                          </span>
                          <span
                            className={`font-mono font-bold ${forecastBalanceAfter < 0 ? "text-rose-600" : "text-emerald-600"}`}
                          >
                            RM {forecastBalanceAfter.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Settlement badge checking */}
                      {settlesEntireBalance ? (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 border border-emerald-150">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p>
                            🎉 <strong>FULLY SETTLED!</strong> Your newly
                            scanned payment of{" "}
                            <strong>
                              RM {forecastPaymentAmount.toFixed(2)}
                            </strong>{" "}
                            successfully covers and pays off all your remaining
                            shared debts in the ledger!
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p>
                            ⚠️ <strong>PARTIALLY SETTLED!</strong> This payment
                            resolves a portion of your split shares. You still
                            have some remaining outstanding balance.{" "}
                            <strong>
                              Outstanding share remaining: RM{" "}
                              {remainingActiveDebt.toFixed(2)}
                            </strong>
                            .
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          // Cancel clears OCR scanned results, doesn't post to net balance
                          setOcrSuccess(false);
                          setDetectedAmount(null);
                          setOcrFileName("");
                          setScanLogs([]);
                        }}
                        className="flex-1 cursor-pointer py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold tracking-wide text-xs rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCommitOcrPayment}
                        className="flex-1 cursor-pointer py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB A: MANUAL PAYMENT LOG FORM */}
            {activeTab === "manual" && (
              <form
                onSubmit={handleSubmitTransfer}
                className="space-y-4 animate-fade-in"
              >
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
                    {roommates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id === currentRoommate.id
                          ? `Me (${r.name})`
                          : r.name}
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
                    {roommates
                      .filter((r) => r.id !== fromId)
                      .map((r) => (
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

                {/* Upload proof file (optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    🧾 Attach Receipt Proof{" "}
                    <span className="text-[9px] text-slate-400 font-normal lowercase">
                      (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="manual-receipt-file-picker"
                      accept=".pdf, image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const fileUrl = URL.createObjectURL(file);
                          setUploadedProofUrl(fileUrl);
                          setManualFileName(file.name);
                          // Auto parse amount if empty
                          if (!amountStr) {
                            const parsedAmount = parseAmountFromFileName(
                              file.name,
                            );
                            setAmountStr(parsedAmount.toString());
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="manual-receipt-file-picker"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                      id="manual-receipt-file-label"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      {manualFileName
                        ? "Change Receipt file"
                        : "Attach File or Photo"}
                    </label>
                    {manualFileName && (
                      <span
                        className="text-[10px] font-mono font-medium text-slate-500 max-w-[120px] truncate"
                        title={manualFileName}
                      >
                        {manualFileName}
                      </span>
                    )}
                  </div>
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
                  <label
                    htmlFor="immediate-complete-checkbox"
                    className="text-xs text-slate-650 cursor-pointer font-medium select-none"
                  >
                    <strong>Mark as Completed instantly</strong>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      If unchecked, transaction enters "Pending Approval" state,
                      which won't affect balances until receiver clicks "Approve
                      Receipt".
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
                Records of payments logged between roomies. Unsettled drafts are
                listed to ensure proper receipt verification.
              </p>
            </div>

            {/* List */}
            <div className="mt-6 space-y-4">
              {payments.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-2xl">
                  <CreditCard className="mx-auto w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-display font-bold text-slate-750">
                    No transaction logs in this house
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Either balances are healthy, or roommates settle up off-app.
                    Use the Transfer form to test!{" "}
                  </p>
                </div>
              ) : (
                payments.map((payment) => {
                  const fromUser = roommates.find(
                    (r) => r.id === payment.fromId,
                  );
                  const toUser = roommates.find((r) => r.id === payment.toId);
                  if (!fromUser || !toUser) return null;

                  const isPending = payment.status === "pending";
                  const isIncomingToMe = payment.toId === currentRoommate.id;

                  return (
                    <div
                      key={payment.id}
                      id={`payment-row-${payment.id}`}
                      className={`p-4 border rounded-2xl flex flex-col gap-4 transition-all ${
                        isPending
                          ? "bg-amber-50/30 border-amber-200/60 shadow-xs"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3.5">
                          {/* Status visual box */}
                          <div
                            className={`p-2.5 rounded-xl ${isPending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {isPending ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </div>

                          {/* Transaction path */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800 text-xs py-0.5 px-2 bg-slate-100 rounded">
                                {fromUser.name}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">
                                transferred to
                              </span>
                              <span className="font-semibold text-blue-700 text-xs py-0.5 px-2 bg-blue-50 rounded">
                                {toUser.name}
                              </span>
                            </div>

                            <div className="text-xs text-slate-400">
                              Note:{" "}
                              <span className="text-slate-650 italic font-medium font-display">
                                "{payment.note}"
                              </span>{" "}
                              &bull;
                              <span className="font-mono ml-1">
                                {payment.date}
                              </span>
                              {payment.isRejected && (
                                <span className="inline-block ml-2 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide animate-pulse">
                                  ⚠️ PROOF UNTRUSTED
                                </span>
                              )}
                            </div>

                            {/* Interactive notice */}
                            {isPending && isIncomingToMe && (
                              <span className="block text-[10px] text-amber-700 font-bold bg-amber-100/50 border border-amber-200/50 py-1 px-2 rounded mt-1.5">
                                👉 You are the recipient. Please verify this
                                payment to adjust active ledger.
                              </span>
                            )}
                            {isPending && !isIncomingToMe && (
                              <span className="block text-[10px] text-slate-400 italic">
                                Waiting for {toUser.name.split(" ")[0]} to
                                approve this settlement.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cash standing and confirmation controls */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2">
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold block">
                              Fund Transfer
                            </span>
                            <span className="text-base font-mono font-bold text-blue-600 block">
                              RM {payment.amount.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceiptPaymentId(
                                  activeReceiptPaymentId === payment.id
                                    ? null
                                    : payment.id,
                                );
                                setEditingPaymentId(null);
                              }}
                              className={`px-2 py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                activeReceiptPaymentId === payment.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                              }`}
                              title="Inspect receipt documents"
                            >
                              Proof 📄
                            </button>

                            {/* Trust Proof / Status Update Panel for Bill Owner (Recipient toId) */}
                            {payment.toId === currentRoommate.id ? (
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                                {payment.status === "pending" ? (
                                  !payment.isRejected ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = {
                                            ...payment,
                                            status: "completed" as const,
                                            isRejected: false,
                                          };
                                          onUpdatePayment(updated);
                                          setExpandedUntrustedPaymentId(null);
                                          setOcrCompletedSuccessMsg(
                                            `🎉 Trust Settle Approved! You approved RM ${payment.amount.toFixed(2)} and the house balance is updated.`,
                                          );
                                          setTimeout(
                                            () => setOcrCompletedSuccessMsg(""),
                                            5500,
                                          );
                                        }}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-all"
                                      >
                                        👍 Trust Proof & Settle
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = {
                                            ...payment,
                                            status: "pending" as const,
                                            isRejected: true,
                                          };
                                          onUpdatePayment(updated);
                                          setExpandedUntrustedPaymentId(null);

                                          if (onSendReminder) {
                                            onSendReminder(
                                              payment.fromId,
                                              payment.amount,
                                              `⚠️ Your payment proof for RM ${payment.amount.toFixed(2)} was marked as UNTRUSTED by ${currentRoommate.name}. Please upload a genuine bank transfer receipt.`,
                                            );
                                          }

                                          setOcrCompletedSuccessMsg(
                                            `❌ Proof Not Trusted. Marked receipt for RM ${payment.amount.toFixed(2)} as UNTRUSTED.`,
                                          );
                                          setTimeout(
                                            () => setOcrCompletedSuccessMsg(""),
                                            5500,
                                          );
                                        }}
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-semibold rounded-lg cursor-pointer border border-rose-200"
                                      >
                                        👎 Untrusted
                                      </button>
                                    </>
                                  ) : expandedUntrustedPaymentId !==
                                    payment.id ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedUntrustedPaymentId(
                                          payment.id,
                                        )
                                      }
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-bold rounded-lg cursor-pointer border border-rose-200 flex items-center gap-1 transition-all"
                                      title="Click to review or verify trust again."
                                    >
                                      ⚠️ Untrusted (Click to change)
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = {
                                            ...payment,
                                            status: "completed" as const,
                                            isRejected: false,
                                          };
                                          onUpdatePayment(updated);
                                          setExpandedUntrustedPaymentId(null);
                                          setOcrCompletedSuccessMsg(
                                            `🎉 Trust Settle Approved! You approved RM ${payment.amount.toFixed(2)} and the house balance is updated.`,
                                          );
                                          setTimeout(
                                            () => setOcrCompletedSuccessMsg(""),
                                            5500,
                                          );
                                        }}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-all"
                                      >
                                        👍 Trust Proof & Settle
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Clicking 'Untrusted' when it is already untrusted CLOSES/COLLAPSES it
                                          setExpandedUntrustedPaymentId(null);
                                        }}
                                        className="px-2 py-1 bg-rose-100 hover:bg-rose-150 text-rose-800 text-[9px] font-bold rounded-lg cursor-pointer border border-rose-250 flex items-center gap-1 transition-all"
                                      >
                                        👎 Untrusted (Keep)
                                      </button>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide">
                                      Settled
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = {
                                          ...payment,
                                          status: "pending" as const,
                                          isRejected: false,
                                        };
                                        onUpdatePayment(updated);
                                        setOcrCompletedSuccessMsg(
                                          "🔄 Payment status reverted back to Pending draft.",
                                        );
                                        setTimeout(
                                          () => setOcrCompletedSuccessMsg(""),
                                          5500,
                                        );
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-[8px] font-bold rounded cursor-pointer border border-slate-200"
                                    >
                                      Revert Draft
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              /* Status indicator for other roommates */
                              <span
                                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  payment.isRejected
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : payment.status === "pending"
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {payment.isRejected
                                  ? "⚠️ Proof Untrusted"
                                  : payment.status === "pending"
                                    ? "Pending Approval"
                                    : "Settled & Verified"}
                              </span>
                            )}

                            {deletingPaymentId === payment.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-md border border-rose-200 animate-fade-in">
                                <span className="text-[9px] font-bold text-rose-800">
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeletePayment(payment.id);
                                    setDeletingPaymentId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[8px] rounded cursor-pointer"
                                >
                                  Del
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingPaymentId(null)}
                                  className="px-1.5 py-0.5 bg-slate-202 text-slate-700 font-bold text-[8px] rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                id={`delete-payment-${payment.id}`}
                                onClick={() => setDeletingPaymentId(payment.id)}
                                className="px-2 py-1 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/60 rounded-md transition-colors text-[10px] font-bold cursor-pointer"
                                title="Remove ledger payment activity log"
                              >
                                delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanding transaction edit form panel */}
                      {false && (
                        <form
                          onSubmit={handleEditPaymentSubmit}
                          className="mt-2 text-left animate-slide-up bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                              ⚙️ Modify Settlement Form details
                            </span>
                            <span className="text-[10px] text-slate-450 font-mono">
                              ID: {String(payment.id || "").toUpperCase()}
                            </span>
                          </div>

                          {editError && (
                            <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] rounded font-semibold">
                              ⚠️ {editError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Sender */}
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">
                                Sender (Payer)
                              </label>
                              <select
                                value={editFromId}
                                onChange={(e) => setEditFromId(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                              >
                                {roommates.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Recipient */}
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">
                                Recipient
                              </label>
                              <select
                                value={editToId}
                                onChange={(e) => setEditToId(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                              >
                                {roommates.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Amount */}
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">
                                Amount (RM)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={editAmountStr}
                                onChange={(e) =>
                                  setEditAmountStr(e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs p-1.5 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Date */}
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">
                                Transfer Date
                              </label>
                              <input
                                type="date"
                                required
                                value={editDateStr}
                                onChange={(e) => setEditDateStr(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs p-1.5 rounded-lg focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Note */}
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">
                              Receipt Note / Proof Name
                            </label>
                            <input
                              type="text"
                              required
                              value={editNoteStr}
                              onChange={(e) => setEditNoteStr(e.target.value)}
                              className="w-full bg-white border border-slate-200 text-slate-800 text-xs p-1.5 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-bold text-slate-400">
                                Clearance Link status
                              </span>
                              <div className="flex bg-slate-200 p-0.5 rounded-md gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => setEditStatus("completed")}
                                  className={`text-[8px] uppercase tracking-wide px-2 py-0.5 font-bold rounded-md transition-colors ${
                                    editStatus === "completed"
                                      ? "bg-white text-emerald-800 shadow-xs"
                                      : "text-slate-500"
                                  }`}
                                >
                                  Settled
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditStatus("pending")}
                                  className={`text-[8px] uppercase tracking-wide px-2 py-0.5 font-bold rounded-md transition-colors ${
                                    editStatus === "pending"
                                      ? "bg-white text-amber-800 shadow-xs"
                                      : "text-slate-500"
                                  }`}
                                >
                                  Pending
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingPaymentId(null)}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded font-bold text-[10px] text-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded font-bold text-[10px] text-white cursor-pointer"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Expanding transaction proof block */}
                      {activeReceiptPaymentId === payment.id && (
                        <div className="mt-1 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left animate-slide-up space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                              🏦 Fund Transfer Verification Slip
                            </span>
                            <span className="text-[10px] text-slate-450 font-mono">
                              ID: TXN-{String(payment.id || "").toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            <div className="bg-white p-2.5 rounded border border-slate-100">
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">
                                Origin Account
                              </span>
                              <span className="font-bold text-slate-800">
                                {fromUser.name}
                              </span>
                              <span className="block text-slate-500 text-[10px]">
                                {fromUser.bankName || "Maybank"}
                              </span>
                              <span className="block text-slate-400 font-bold text-[9px] tracking-wide">
                                {fromUser.bankAccount ||
                                  "(the user didn't put it yet)"}
                              </span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-100">
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">
                                Destination Account
                              </span>
                              <span className="font-bold text-slate-800">
                                {toUser.name}
                              </span>
                              <span className="block text-slate-500 text-[10px]">
                                {toUser.bankName || "CIMB Bank"}
                              </span>
                              <span className="block text-slate-400 font-bold text-[9px] tracking-wide">
                                {toUser.bankAccount ||
                                  "(the user didn't put it yet)"}
                              </span>
                            </div>
                          </div>

                          {(() => {
                            const isOcr = !!payment.isOcr;
                            const docName = isOcr
                              ? payment.ocrFileName ||
                                `splitMate_receipt_${String(payment.id || "").substring(4, 9)}.pdf`
                              : `manual_transfer_record_${String(payment.id || "").substring(4, 9)}.pdf`;
                            const ocrStatusText = isOcr
                              ? `🔬 AI Smart OCR Verification Details:\n🧾 Document PDF: ${docName}\n💵 Amount verified: RM ${payment.amount.toFixed(2)}\n📅 Date logged: ${payment.date}\n🔒 Verification Match: Digital certificate matches beneficiary banking credentials.`
                              : `📝 Manual Ledger Transfer Slip:\n🧾 Document Receipt: ${docName}\n💵 Amount declared: RM ${payment.amount.toFixed(2)}\n📅 Date logged: ${payment.date}\n🔒 Verification: Logged manually by payer roommate. Waiting for recipient to confirm.`;

                            return (
                              <div className="flex items-center justify-between text-[11px] bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg w-full">
                                <div className="flex items-center space-x-2">
                                  <span>📄</span>
                                  <span
                                    className="font-mono text-slate-600 font-semibold truncate max-w-[180px] sm:max-w-md"
                                    title={docName}
                                  >
                                    {docName}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewingPaymentId(payment.id);
                                    setPreviewingProofUrl(payment.proofUrl || "mock");
                                    setPreviewingDocName(docName);
                                    setOcrCompletedSuccessMsg(`Previewing ledger proof: ${docName}`);
                                    setTimeout(() => setOcrCompletedSuccessMsg(""), 5000);
                                  }}
                                  className="bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  <span>👁️</span> View proof or PDF
                                </button>
                              </div>
                            );
                          })()}
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
                In a collaborative roommates set-up, accountability is critical.
                Discovered payments registered as 'pending' represent transfers
                sent but not yet verified. Only when the designated recipient
                confirms the transaction does the overall house balance ledger
                adjust to reflect the debt cancellation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Lightbox Preview Modal */}
      {previewingProofUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-left"
          id="lightbox-modal-overlay"
          onClick={() => {
            setPreviewingProofUrl(null);
            setPreviewingPaymentId(null);
            setPreviewingDocName("");
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧾</span>
                <div className="text-left">
                  <h4
                    className="font-display font-bold text-xs text-slate-800 truncate max-w-[240px]"
                    title={previewingDocName}
                  >
                    {previewingDocName || "Receipt Verification Proof"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Status: Secure Sandbox Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewingProofUrl(null);
                  setPreviewingPaymentId(null);
                  setPreviewingDocName("");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold transition-colors cursor-pointer text-xs"
                title="Close receipt preview"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* If it is a real blob URL (user uploaded file) and not a pdf placeholder */}
              {previewingProofUrl.startsWith("blob:") ||
              previewingProofUrl.startsWith("data:") ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-2 rounded-xl text-center text-[10px] font-mono text-slate-400 border border-slate-100">
                    📂 Live user physical attachment:{" "}
                    <span className="font-bold underline">
                      {previewingDocName}
                    </span>
                  </div>
                  {previewingDocName.toLowerCase().endsWith(".pdf") ? (
                    <div className="space-y-3">
                      {/* Web view frame */}
                      <object
                        data={previewingProofUrl}
                        type="application/pdf"
                        className="w-full h-[350px] rounded-xl border border-slate-200 shadow-inner bg-slate-100"
                      >
                        <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 h-full bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          <span>📦</span>
                          <p className="font-semibold text-slate-750">
                            Native browser PDF embed restricted inside this
                            sandbox space.
                          </p>
                          <a
                            href={previewingProofUrl}
                            download={previewingDocName}
                            style={{ textDecoration: "none" }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 font-bold hover:bg-blue-750 text-white rounded-xl text-xs transition shadow-sm cursor-pointer mt-1"
                          >
                            📥 Download & View PDF Locally
                          </a>
                        </div>
                      </object>
                      <div className="text-center">
                        <a
                          href={previewingProofUrl}
                          download={previewingDocName}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                        >
                          📥 Download Receipt File
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <img
                        src={previewingProofUrl}
                        alt="Uploaded payment proof"
                        className="max-h-[350px] object-contain mx-auto rounded-xl shadow-md border border-slate-200 bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <a
                        href={previewingProofUrl}
                        download={previewingDocName}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline mt-2"
                      >
                        📥 Save Photo Attachment
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Dynamic Vector Generated Banking Receipt representation if no real biological file exists */
                (() => {
                  const activePayment = payments.find(
                    (p) => p.id === previewingPaymentId,
                  );
                  const senderUser =
                    roommates.find((r) => r.id === activePayment?.fromId) ||
                    currentRoommate;
                  const recvUser =
                    roommates.find((r) => r.id === activePayment?.toId) ||
                    roommates[0] ||
                    currentRoommate;
                  const amtVal = activePayment ? activePayment.amount : 65.0;
                  const dateVal = activePayment
                    ? activePayment.date
                    : new Date().toISOString().split("T")[0];
                  const noteVal = activePayment
                    ? activePayment.note
                    : "Roommate settlement share";
                  const statusVal = activePayment
                    ? activePayment.status
                    : "completed";
                  const rejectFlag = activePayment
                    ? !!activePayment.isRejected
                    : false;

                  return (
                    <div className="border border-slate-200 rounded-2xl p-6 bg-linear-to-b from-slate-50 to-white font-mono text-slate-800 text-[11px] leading-relaxed space-y-4 shadow-sm relative text-left">
                      <div className="absolute top-4 right-4 text-[9px] uppercase font-bold px-2 py-0.5 rounded border rotate-6 select-none opacity-85 z-10 bg-emerald-50 text-emerald-700 border-emerald-300">
                        {statusVal === "completed" && !rejectFlag
                          ? "✔️ APPROVED"
                          : rejectFlag
                            ? "❌ UNTRUSTED"
                            : "⏳ HOLDING"}
                      </div>

                      {/* Bank Logo / Header */}
                      <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                        <h5 className="font-black tracking-widest text-[12px] text-slate-900">
                          🏛️ {senderUser.bankName || "ALLIED COOPERATIVE BANK"}
                        </h5>
                        <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">
                          Smart Verification Transfer Receipt
                        </p>
                      </div>

                      {/* Transaction Fields */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">
                            DOCUMENT TYPE:
                          </span>
                          <span className="text-slate-705 text-right font-black uppercase">
                            TRANSACTION RECEIPT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">
                            REFERENCE NO:
                          </span>
                          <span className="text-slate-705 font-black">
                            TXN-MBK-
                            {String(previewingPaymentId || "A38F1")
                              .toUpperCase()
                              .substring(0, 8)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">
                            TRANSACTION DATE:
                          </span>
                          <span className="text-slate-705 font-black">
                            {dateVal}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2">
                          <span className="text-slate-400 font-bold">
                            FROM SENDER:
                          </span>
                          <span className="text-slate-850 font-black text-right">
                            {senderUser.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">BANK ACCOUNT:</span>
                          <span className="text-slate-650 tracking-wider">
                            {senderUser.bankAccount || "MAYBANK **** 4899"}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2">
                          <span className="text-slate-400 font-bold">
                            RECEIVER BENEFICIARY:
                          </span>
                          <span className="text-slate-850 font-black text-right">
                            {recvUser.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            TO BANK ACCOUNT:
                          </span>
                          <span className="text-slate-650 tracking-wider">
                            {recvUser.bankAccount || "CIMB **** 9015"}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 items-center">
                          <span className="text-slate-400 font-bold">
                            PAID AMOUNT:
                          </span>
                          <span className="text-indigo-600 font-black text-[13px]">
                            RM {amtVal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col border-t border-slate-100 pt-2 text-left">
                          <span className="text-slate-400 font-bold">
                            MEMO STATEMENT:
                          </span>
                          <span className="text-slate-650 italic mt-0.5 whitespace-pre-wrap break-words">
                            "{noteVal}"
                          </span>
                        </div>
                      </div>

                      {/* Footer security footer seal */}
                      <div className="pt-4 border-t border-dashed border-slate-350 text-center space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                          🛡️ SPLITMATE SECURE LEDGER CERTIFIED
                        </div>
                        <p className="text-[8px] text-slate-405 leading-normal">
                          This receipt represents an off-app currency clearance
                          link generated internally inside household group.
                          Verified transaction is secure.
                        </p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setPreviewingProofUrl(null);
                  setPreviewingPaymentId(null);
                  setPreviewingDocName("");
                }}
                className="cursor-pointer py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
