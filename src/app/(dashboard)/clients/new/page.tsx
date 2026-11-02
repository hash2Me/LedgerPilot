"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TAX_ENTITIES = ["LLC", "S-Corp", "C-Corp", "Sole Prop", "Partnership"] as const;

interface FormState {
  companyName: string;
  taxEntity: string;
  ein: string;
  contactEmail: string;
  assignedAccountant: string;
  notes: string;
}

const INITIAL: FormState = {
  companyName: "",
  taxEntity: "",
  ein: "",
  contactEmail: "",
  assignedAccountant: "",
  notes: "",
};

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required.";
    if (!form.taxEntity) e.taxEntity = "Select a tax entity type.";
    if (!form.contactEmail.trim()) {
      e.contactEmail = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      e.contactEmail = "Enter a valid email address.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create client");
      router.push("/dashboard/clients");
    } catch {
      setErrors({ companyName: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
  const errorCls = "mt-1 text-xs text-red-600";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Clients
      </Link>

      <Card title="New Client" description="Add a new client to your firm.">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className={labelCls}>
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="Acme Corp"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
            {errors.companyName && <p className={errorCls}>{errors.companyName}</p>}
          </div>

          {/* Tax Entity */}
          <div>
            <label className={labelCls}>
              Tax Entity <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={form.taxEntity}
              onChange={(e) => set("taxEntity", e.target.value)}
            >
              <option value="">Select entity type…</option>
              {TAX_ENTITIES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.taxEntity && <p className={errorCls}>{errors.taxEntity}</p>}
          </div>

          {/* EIN */}
          <div>
            <label className={labelCls}>EIN / Tax ID</label>
            <input
              className={inputCls}
              placeholder="XX-XXXXXXX"
              value={form.ein}
              onChange={(e) => set("ein", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              placeholder="contact@acme.com"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
            {errors.contactEmail && <p className={errorCls}>{errors.contactEmail}</p>}
          </div>

          {/* Assigned Accountant */}
          <div>
            <label className={labelCls}>Assigned Accountant</label>
            <select
              className={inputCls}
              value={form.assignedAccountant}
              onChange={(e) => set("assignedAccountant", e.target.value)}
            >
              <option value="">Select accountant…</option>
              <option value="sarah-chen">Sarah Chen</option>
              <option value="marcus-rivera">Marcus Rivera</option>
              <option value="james-okafor">James Okafor</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} min-h-[100px] resize-y`}
              placeholder="Internal notes about this client…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button variant="secondary" type="button" onClick={() => router.push("/dashboard/clients")}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Client
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
