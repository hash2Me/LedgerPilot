import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const clients = [
  {
    id: "c1",
    company: "Greenfield Landscaping LLC",
    taxEntity: "LLC",
    status: "Active" as const,
    accountant: "Sarah Chen",
    created: "2024-09-12",
  },
  {
    id: "c2",
    company: "Apex Digital Solutions Inc.",
    taxEntity: "S-Corp",
    status: "Onboarding" as const,
    accountant: "Marcus Rivera",
    created: "2024-11-03",
  },
  {
    id: "c3",
    company: "Bella Rosa Bakery",
    taxEntity: "Sole Prop",
    status: "Active" as const,
    accountant: "Sarah Chen",
    created: "2024-06-21",
  },
  {
    id: "c4",
    company: "Summit Construction Group",
    taxEntity: "C-Corp",
    status: "Archived" as const,
    accountant: "James Okafor",
    created: "2023-12-05",
  },
];

const statusVariant = {
  Active: "success",
  Onboarding: "warning",
  Archived: "default",
} as const;

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your firm&apos;s client roster and engagement status.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Search / Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search clients…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Onboarding</option>
          <option>Archived</option>
        </select>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Entities</option>
          <option>LLC</option>
          <option>S-Corp</option>
          <option>C-Corp</option>
          <option>Sole Prop</option>
          <option>Partnership</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Company Name", "Tax Entity", "Status", "Assigned Accountant", "Created", "Actions"].map(
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
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                  {c.company}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {c.taxEntity}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {c.accountant}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {c.created}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/clients/${c.id}/edit`}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Edit
                    </Link>
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
