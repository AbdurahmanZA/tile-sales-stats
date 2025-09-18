import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const inventoryData = [
  { name: 'In Stock', value: 89, color: 'hsl(var(--primary))' },
  { name: 'Low Stock', value: 8, color: 'hsl(142 71% 45%)' }, // orange
  { name: 'Dead Stock', value: 3, color: 'hsl(var(--destructive))' },
];

export const InventoryChart = () => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={inventoryData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {inventoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value}%`, '']}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend 
          wrapperStyle={{
            fontSize: '12px',
            color: 'hsl(var(--muted-foreground))',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};