import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Placeholder stat cards for the dashboard overview */
const stats = [
  {
    label: "Total Clients",
    value: "24",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    iconColor: "text-blue-500",
    icon: (
      // Users icon
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Pending Invoices",
    value: "8",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    iconColor: "text-amber-500",
    icon: (
      // File-text icon
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Voice Notes",
    value: "12",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    iconColor: "text-violet-500",
    icon: (
      // Mic icon
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    label: "Document Requests",
    value: "5",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    iconColor: "text-emerald-500",
    icon: (
      // Folder icon
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "there";

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {userName} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s an overview of your firm&apos;s activity.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className={`mt-2 text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor} ${stat.iconColor}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for future widgets */}
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <p className="text-sm text-slate-400">
          More dashboard widgets coming soon — recent activity, charts, quick
          actions.
        </p>
      </div>
    </div>
  );
}
