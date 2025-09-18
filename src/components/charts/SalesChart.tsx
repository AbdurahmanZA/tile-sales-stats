import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const salesData = [
  { month: 'Jan', johannesburg: 285000, capetown: 198000, pretoria: 0 },
  { month: 'Feb', johannesburg: 310000, capetown: 215000, pretoria: 0 },
  { month: 'Mar', johannesburg: 295000, capetown: 235000, pretoria: 0 },
  { month: 'Apr', johannesburg: 340000, capetown: 258000, pretoria: 0 },
  { month: 'May', johannesburg: 380000, capetown: 275000, pretoria: 0 },
  { month: 'Jun', johannesburg: 420000, capetown: 290000, pretoria: 0 },
];

export const SalesChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-muted-foreground"
          fontSize={12}
        />
        <YAxis 
          className="text-muted-foreground"
          fontSize={12}
          tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          formatter={(value: number) => [`R${value.toLocaleString()}`, '']}
          labelClassName="text-foreground"
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Bar 
          dataKey="johannesburg" 
          fill="hsl(var(--primary))" 
          name="Johannesburg"
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          dataKey="capetown" 
          fill="hsl(var(--secondary))" 
          name="Cape Town"
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          dataKey="pretoria" 
          fill="hsl(var(--muted))" 
          name="Pretoria (Offline)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};