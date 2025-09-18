import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const customerData = [
  { month: 'Jan', newCustomers: 24, retention: 85 },
  { month: 'Feb', newCustomers: 28, retention: 87 },
  { month: 'Mar', newCustomers: 31, retention: 86 },
  { month: 'Apr', newCustomers: 35, retention: 89 },
  { month: 'May', newCustomers: 42, retention: 91 },
  { month: 'Jun', newCustomers: 38, retention: 89 },
];

export const CustomerChart = () => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={customerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-muted-foreground"
          fontSize={12}
        />
        <YAxis 
          className="text-muted-foreground"
          fontSize={12}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Line 
          type="monotone" 
          dataKey="newCustomers" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          name="New Customers"
          dot={{ fill: 'hsl(var(--primary))' }}
        />
        <Line 
          type="monotone" 
          dataKey="retention" 
          stroke="hsl(142 71% 45%)" 
          strokeWidth={2}
          name="Retention %"
          dot={{ fill: 'hsl(142 71% 45%)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};