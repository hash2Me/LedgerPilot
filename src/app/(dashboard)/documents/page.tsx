import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const requests = [
  {
    id: "dr-1",
    title: "2024 W-2 Forms",
    client: "Greenfield Landscaping LLC",
    status: "Requested" as const,
    dueDate: "2025-01-31",
    submittedFile: null,
  },
  {
    id: "dr-2",
    title: "Q3 Bank Statements",
    client: "Apex Digital Solutions Inc.",
    status: "Submitted" as const,
    dueDate: "2024-11-15",
    submittedFile: "apex_q3_bank.pdf",
  },
  {
    id: "dr-3",
    title: "Articles of Incorporation",
    client: "Bella Rosa Bakery",
    status: "Verified" as const,
    dueDate: "2024-10-01",
    submittedFile: "bella_rosa_articles.pdf",
  },
  {
    id: "dr-4",
    title: "1099 Contractor Payments",
    client: "Summit Construction Group",
    status: "Requested" as const,
    dueDate: "2025-01-15",
    submittedFile: null,
  },
];

const statusVariant = {
  Requested: "info",
  Submitted: "warning",
  Verified: "success",
} as const;

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track documents requested from clients and their submission status.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Request
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Title", "Client", "Status", "Due Date", "Submitted File", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                  {req.title}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {req.client}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {req.dueDate}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {req.submittedFile ? (
                    <Link
                      href="#"
                      className="text-blue-600 hover:underline"
                    >
                      {req.submittedFile}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                      View
                    </button>
                    {req.status === "Submitted" && (
                      <button className="rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                        Verify
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
