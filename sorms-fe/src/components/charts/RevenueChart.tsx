import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { month: "Jan", revenue: 32 },
  { month: "Feb", revenue: 41 },
  { month: "Mar", revenue: 38 },
  { month: "Apr", revenue: 54 },
  { month: "May", revenue: 58 }
];

export function RevenueChart() {
  return (
    <div className="glass-card rounded-xl p-4">
      <h4 className="mb-3 font-semibold">Revenue Trend</h4>
      <div className="h-56 min-h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <LineChart data={data}>
            <XAxis dataKey="month" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#06B6D4" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
