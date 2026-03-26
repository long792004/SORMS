import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Occupied", value: 68 },
  { name: "Available", value: 32 }
];

const colors = ["#2563EB", "#06B6D4"];

export function OccupancyChart() {
  return (
    <div className="glass-card rounded-xl p-4">
      <h4 className="mb-3 font-semibold">Occupancy</h4>
      <div className="min-h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={85}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
