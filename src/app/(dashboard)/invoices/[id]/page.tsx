"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string | null;
  vendorName: string;
  transactionDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  category: string | null;
  fileUrl: string;
  stagingStatus: "PENDING" | "APPROVED" | "REJECTED";
  aiRawResponse: string | null;
  items: LineItem[];
  client: {
    id: string;
    companyName: string;
    taxEntity: string;
  };
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [category, setCategory] = useState("");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch invoice details
  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load invoice details");
        }
        const json = await res.json();
        const data: InvoiceDetail = json.data;

        setInvoice(data);
        setVendorName(data.vendorName || "");
        setInvoiceNumber(data.invoiceNumber || "");
        setTransactionDate(
          data.transactionDate ? new Date(data.transactionDate).toISOString().split("T")[0] : ""
        );
        setCategory(data.category || "");
        setSubtotal(Number(data.subtotal) || 0);
        setTaxAmount(Number(data.taxAmount) || 0);
        setTotalAmount(Number(data.totalAmount) || 0);
        setItems(
          (data.items || []).map((i) => ({
            id: i.id,
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            amount: Number(i.amount),
          }))
        );
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Error loading invoice" });
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  // Recalculate totals from items
  const recalculateFromItems = (updatedItems: LineItem[]) => {
    const computedSubtotal = updatedItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setSubtotal(Number(computedSubtotal.toFixed(2)));
    setTotalAmount(Number((computedSubtotal + taxAmount).toFixed(2)));
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Auto-calculate amount if qty or unitPrice changed
    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? Number(value) : current.quantity;
      const p = field === "unitPrice" ? Number(value) : current.unitPrice;
      current.amount = Number((q * p).toFixed(2));
    }

    updated[index] = current;
    setItems(updated);
    recalculateFromItems(updated);
  };

  const handleAddItem = () => {
    const updated = [
      ...items,
      { description: "New Item", quantity: 1, unitPrice: 0, amount: 0 },
    ];
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalculateFromItems(updated);
  };

  // Save / Approve / Reject Handler
  const handleSaveStatus = async (targetStatus?: "PENDING" | "APPROVED" | "REJECTED") => {
    setIsSaving(true);
    setMessage(null);

    const statusToSave = targetStatus || invoice?.stagingStatus || "PENDING";

    try {
      const payload = {
        stagingStatus: statusToSave,
        vendorName,
        category,
        subtotal,
        taxAmount,
        totalAmount,
        items,
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update invoice");
      }

      setInvoice((prev) => (prev ? { ...prev, stagingStatus: statusToSave } : null));
      setMessage({
        type: "success",
        text:
          statusToSave === "APPROVED"
            ? "Invoice approved and successfully committed to General Ledger!"
            : statusToSave === "REJECTED"
            ? "Invoice marked as rejected/disallowed."
            : "Invoice changes saved successfully.",
      });

      if (statusToSave === "APPROVED") {
        setTimeout(() => router.push("/invoices"), 1500);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save invoice" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Invoice not found.</p>
        <Link href="/invoices" className="mt-4 inline-block text-blue-600 underline">
          &larr; Return to Invoices
        </Link>
      </div>
    );
  }

  // Parse confidence score if available
  let confidenceScore = 95;
  try {
    if (invoice.aiRawResponse) {
      const parsed = JSON.parse(invoice.aiRawResponse);
      if (parsed.confidenceScore) confidenceScore = parsed.confidenceScore;
    }
  } catch (e) {}

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Staging Queue
        </Link>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              invoice.stagingStatus === "APPROVED"
                ? "success"
                : invoice.stagingStatus === "REJECTED"
                ? "danger"
                : "warning"
            }
          >
            Status: {invoice.stagingStatus}
          </Badge>
          <Badge variant={confidenceScore > 90 ? "success" : "info"}>
            AI Confidence: {confidenceScore}%
          </Badge>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Split View */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Document Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Source Document">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[500px] max-h-[700px] p-2">
              {invoice.fileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.fileUrl}
                  alt="Invoice source document"
                  className="max-h-[680px] w-auto object-contain rounded"
                />
              ) : (
                <div className="text-center text-slate-400 p-6">
                  <p>No document image available</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Client: <strong className="text-slate-700">{invoice.client.companyName}</strong></span>
              <a
                href={invoice.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Open in Fullscreen &rarr;
              </a>
            </div>
          </Card>
        </div>

        {/* Right Side: Editable Data & Line Items (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card title="Extracted Accounting Data" description="Human-in-the-loop audit: review and refine values before posting">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vendor / Supplier Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Invoice Reference #</label>
                <input
                  type="text"
                  className={inputCls}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Transaction Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Expense Category</label>
                <input
                  type="text"
                  className={inputCls}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Itemized Line Breakdown ({items.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-center font-semibold w-16">Qty</th>
                      <th className="px-3 py-2 text-right font-semibold w-24">Price</th>
                      <th className="px-3 py-2 text-right font-semibold w-24">Amount</th>
                      <th className="px-2 py-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            className="w-full text-center rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                            className="w-full text-right rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          ${Number(item.amount).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600 text-base"
                            title="Remove item"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Tax Amount:</span>
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTaxAmount(val);
                      setTotalAmount(Number((subtotal + val).toFixed(2)));
                    }}
                    className="w-20 text-right rounded border border-slate-200 px-2 py-0.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Committed Amount:</span>
                <span className="text-blue-600">${totalAmount.toFixed(2)} {invoice.currency}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                variant="ghost"
                onClick={() => handleSaveStatus()}
                disabled={isSaving}
              >
                Save Draft
              </Button>

              <button
                type="button"
                onClick={() => handleSaveStatus("REJECTED")}
                disabled={isSaving}
                className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                Reject / Disallow
              </button>

              <button
                type="button"
                onClick={() => handleSaveStatus("APPROVED")}
                disabled={isSaving}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve &amp; Commit to Ledger
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
