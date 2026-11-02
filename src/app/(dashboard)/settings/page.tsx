import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  { name: "Sarah Chen", email: "sarah@ledgerpilot.com", role: "Admin" },
  { name: "Marcus Rivera", email: "marcus@ledgerpilot.com", role: "Accountant" },
  { name: "James Okafor", email: "james@ledgerpilot.com", role: "Accountant" },
  { name: "Priya Patel", email: "priya@ledgerpilot.com", role: "Viewer" },
];

export default function SettingsPage() {
  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your profile, firm details, team, and billing.
        </p>
      </div>

      {/* ---- Profile ---- */}
      <Card title="Profile" description="Your personal account information.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} defaultValue="Sarah Chen" disabled />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} defaultValue="sarah@ledgerpilot.com" disabled />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            Edit Profile
          </button>
        </div>
      </Card>

      {/* ---- Firm ---- */}
      <Card title="Firm" description="Manage your firm details. Only administrators can modify these settings.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Firm Name</label>
            <input className={inputCls} defaultValue="Chen & Associates CPA" />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input className={inputCls} defaultValue="chen-associates" />
          </div>
        </div>
        <p className="mt-3 text-xs text-amber-600">
          ⚠ Only users with the <strong>Admin</strong> role can update firm settings.
        </p>
        <div className="mt-4 flex justify-end">
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </Card>

      {/* ---- Team ---- */}
      <Card title="Team" description="People in your firm with access to LedgerPilot.">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Name", "Email", "Role"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((m) => (
                <tr key={m.email} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    {m.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {m.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge
                      variant={
                        m.role === "Admin"
                          ? "info"
                          : m.role === "Accountant"
                          ? "success"
                          : "default"
                      }
                    >
                      {m.role}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---- Billing ---- */}
      <Card title="Billing" description="Your current subscription and usage.">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-lg font-semibold text-slate-900">Free Tier</p>
            <p className="text-sm text-slate-500">
              Up to 5 clients · 50 invoice scans/mo · 1 team member
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
            Upgrade Plan
          </button>
        </div>
      </Card>
    </div>
  );
}
