"use client";

import { TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";

const stats = [
  { label: "Total Revenue", value: "$284,500", change: "+12.5%", icon: DollarSign },
  { label: "Active Bookings", value: "48", change: "+8.2%", icon: TrendingUp },
  { label: "Guests Checked In", value: "124", change: "+3.1%", icon: Users },
  { label: "Avg Stay Duration", value: "3.2 days", change: "+5.4%", icon: Clock },
];

const recentBookings = [
  { guest: "Victoria Chen", room: "Royal Suite", dates: "May 15 - May 20", status: "Confirmed", amount: "$12,500" },
  { guest: "Marcus Adeyemi", room: "Desert Villa", dates: "May 16 - May 19", status: "Checked In", amount: "$5,400" },
  { guest: "Sophie Laurent", room: "Oasis Room", dates: "May 18 - May 22", status: "Pending", amount: "$3,200" },
  { guest: "James Wilson", room: "Penthouse", dates: "May 20 - May 25", status: "Confirmed", amount: "$17,500" },
  { guest: "Aisha Patel", room: "Desert Villa", dates: "May 22 - May 26", status: "Pending", amount: "$7,200" },
];

const statusColors: Record<string, string> = {
  Confirmed: "text-gold bg-gold/10 border border-gold/20",
  "Checked In": "text-green-400 bg-green-400/10 border border-green-400/20",
  Pending: "text-muted bg-white/5 border border-white/10",
};

export default function AdminDashboard() {
  return (
    <div className="pt-32">
      <SectionHeader
        tag="Administration"
        title="Management Dashboard"
        subtitle="Real-time overview of hotel operations."
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon size={20} className="text-gold" />
                  <span className="text-xs text-green-400 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-heading mb-1">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-heading text-sm tracking-wider uppercase text-gold">Recent Bookings</h3>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted font-medium uppercase tracking-wider text-xs">Guest</th>
                  <th className="text-left p-4 text-muted font-medium uppercase tracking-wider text-xs">Room</th>
                  <th className="text-left p-4 text-muted font-medium uppercase tracking-wider text-xs">Dates</th>
                  <th className="text-left p-4 text-muted font-medium uppercase tracking-wider text-xs">Status</th>
                  <th className="text-right p-4 text-muted font-medium uppercase tracking-wider text-xs">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.guest} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-4">{b.guest}</td>
                    <td className="p-4 text-muted">{b.room}</td>
                    <td className="p-4 text-muted">{b.dates}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs ${statusColors[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-heading">{b.amount}</td>
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
