"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  vendorName: string;
  transactionDate: string;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  currency: string;
  category: string | null;
  fileUrl: string;
  stagingStatus: "PENDING" | "APPROVED" | "REJECTED";
  aiRawResponse: string | null;
  client?: {
    id: string;
    companyName: string;
    taxEntity: string;
  };
  items?: InvoiceItem[];
}

interface ClientOption {
  id: string;
  companyName: string;
  taxEntity: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial invoices & clients list
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [invoicesRes, clientsRes] = await Promise.all([
          fetch("/api/invoices"),
          fetch("/api/clients"),
        ]);

        if (invoicesRes.ok) {
          const invJson = await invoicesRes.json();
          setInvoices(invJson.data || []);
        }

        if (clientsRes.ok) {
          const clientJson = await clientsRes.json();
          const clientList: ClientOption[] = clientJson.data || [];
          setClients(clientList);
          if (clientList.length > 0) {
            setSelectedClientId(clientList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch invoice data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Drag & Drop / File Upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatusMsg("Analyzing document with AI Vision OCR...");
    setSuccessBanner(null);
    setErrorBanner(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedClientId) {
        formData.append("clientId", selectedClientId);
      }

      const res = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to parse and upload invoice");
      }

      const newInvoice: Invoice = result.data.invoice;
      setInvoices((prev) => [newInvoice, ...prev]);
      setSuccessBanner(
        `Successfully extracted invoice from "${newInvoice.vendorName}" ($${Number(newInvoice.totalAmount).toFixed(2)}) into Staging Queue!`
      );
    } catch (err: any) {
      setErrorBanner(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
      setUploadStatusMsg("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Quick Staging Approval/Rejection
  const handleQuickStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stagingStatus: status }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update staging status");
      }

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, stagingStatus: status } : inv))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesTab = activeTab === "ALL" || inv.stagingStatus === activeTab;
    const matchesSearch =
      !searchQuery ||
      inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.client?.companyName && inv.client.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const pendingCount = invoices.filter((i) => i.stagingStatus === "PENDING").length;
  const approvedCount = invoices.filter((i) => i.stagingStatus === "APPROVED").length;
  const rejectedCount = invoices.filter((i) => i.stagingStatus === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices &amp; Receipts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Automated vision extraction, line-item classification, and human-in-the-loop review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Assign To Client:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.taxEntity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-600 hover:text-rose-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* AI Upload Dropzone */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0] && !isUploading) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all cursor-pointer ${
          isUploading
            ? "border-blue-500 bg-blue-50/50 cursor-wait"
            : "border-slate-300 bg-slate-50/60 hover:border-blue-500 hover:bg-blue-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-semibold text-blue-900">{uploadStatusMsg}</p>
            <p className="text-xs text-blue-600">Running GPT-4o Vision &amp; Accounting Validation...</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-800">
              Drag &amp; drop an invoice or receipt here, or <span className="text-blue-600 underline">browse files</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supports PDF, PNG, JPG, WEBP (up to 25 MB) — extracts line items, tax, and vendor instantly
            </p>
          </>
        )}
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {(
            [
              { id: "ALL", label: "All Invoices", count: invoices.length },
              { id: "PENDING", label: "Pending Staging", count: pendingCount },
              { id: "APPROVED", label: "Approved", count: approvedCount },
              { id: "REJECTED", label: "Rejected", count: rejectedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} <span className="opacity-70 ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search vendor, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Staging Queue Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Invoice / Vendor</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Loading invoices...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No invoices found in this view. Upload one above to get started!
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const totalNum = Number(inv.totalAmount);
                const dateStr = new Date(inv.transactionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{inv.vendorName}</div>
                      <div className="text-xs text-slate-400 font-mono">{inv.invoiceNumber || "No Ref #"}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-slate-700 font-medium">{inv.client?.companyName || "Unassigned"}</div>
                      <div className="text-xs text-slate-400">{inv.client?.taxEntity}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{dateStr}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      ${totalNum.toFixed(2)} <span className="text-xs text-slate-400 font-normal">{inv.currency}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {inv.category || "General Expense"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={
                          inv.stagingStatus === "APPROVED"
                            ? "success"
                            : inv.stagingStatus === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {inv.stagingStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {inv.stagingStatus === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleQuickStatusUpdate(inv.id, "APPROVED")}
                              className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Approve & Post to General Ledger"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleQuickStatusUpdate(inv.id, "REJECTED")}
                              className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Reject / Disallow"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Review &rarr;
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
