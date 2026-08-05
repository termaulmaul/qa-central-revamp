'use client';

import { BarChart3, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Dashboard() {
  const stats = [
    { label: 'Test Coverage', value: '72%', change: '+5%', icon: CheckCircle2 },
    { label: 'Total Test Cases', value: '2,847', change: '+142', icon: TrendingUp },
    { label: 'Failed Tests', value: '34', change: '-12', icon: AlertCircle },
    { label: 'Execution Time', value: '2h 14m', change: '-18m', icon: BarChart3 },
  ];

  const recentRequirements = [
    { id: 'RQ-1042', title: 'User SSO Authentication via Okta', risk: 'High', coverage: 85, status: 'approved' },
    { id: 'RQ-1043', title: 'Role-based access control for admin dashboard', risk: 'High', coverage: 40, status: 'review' },
    { id: 'RQ-1044', title: 'Session timeout after 15 minutes of inactivity', risk: 'Low', coverage: 100, status: 'approved' },
    { id: 'RQ-1045', title: 'Password reset flow with email OTP', risk: 'Medium', coverage: 15, status: 'draft' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-8 space-y-8 pb-20">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 spring-transition hover:border-zinc-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-zinc-100">{stat.value}</span>
                  <span className="text-xs text-emerald-400">{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Requirements */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
            <h3 className="text-sm font-semibold text-zinc-100">Recent Requirements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50">
                  <th className="px-6 py-3 text-left font-medium text-zinc-400">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-400">Title</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-400">Risk</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-400">Coverage</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequirements.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 spring-transition"
                  >
                    <td className="px-6 py-3">
                      <span className="font-mono text-indigo-400">{req.id}</span>
                    </td>
                    <td className="px-6 py-3 text-zinc-300">{req.title}</td>
                    <td className="px-6 py-3">
                      <Badge variant={req.risk === 'High' ? 'danger' : req.risk === 'Medium' ? 'warning' : 'success'}>
                        {req.risk}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${req.coverage}%` }}
                          ></div>
                        </div>
                        <span className="text-zinc-400 text-xs">{req.coverage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={req.status === 'approved' ? 'success' : req.status === 'review' ? 'warning' : 'default'}
                      >
                        {req.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
