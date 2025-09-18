-- Create tables for QuickBooks tile business data
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'offline',
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sales data
CREATE TABLE public.sales_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id),
  transaction_date DATE NOT NULL,
  customer_name TEXT,
  tile_style TEXT,
  quantity_sold INTEGER,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  margin_percentage DECIMAL(5,2),
  currency TEXT DEFAULT 'ZAR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for inventory data
CREATE TABLE public.inventory_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id),
  tile_style TEXT NOT NULL,
  current_stock INTEGER,
  reorder_level INTEGER,
  last_turnover_date DATE,
  cost_per_unit DECIMAL(10,2),
  supplier TEXT,
  status TEXT, -- 'in_stock', 'low_stock', 'dead_stock'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for customer data
CREATE TABLE public.customer_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id),
  customer_name TEXT NOT NULL,
  contact_info TEXT,
  first_purchase_date DATE,
  last_purchase_date DATE,
  total_purchases DECIMAL(10,2),
  lead_source TEXT,
  retention_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for operational data
CREATE TABLE public.operations_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id),
  date DATE NOT NULL,
  labor_cost DECIMAL(10,2),
  installations_completed INTEGER,
  scheduled_installations INTEGER,
  efficiency_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_data ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all access for single user)
CREATE POLICY "Allow all access to branches" ON public.branches FOR ALL USING (true);
CREATE POLICY "Allow all access to sales_data" ON public.sales_data FOR ALL USING (true);
CREATE POLICY "Allow all access to inventory_data" ON public.inventory_data FOR ALL USING (true);
CREATE POLICY "Allow all access to customer_data" ON public.customer_data FOR ALL USING (true);
CREATE POLICY "Allow all access to operations_data" ON public.operations_data FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_data_updated_at
  BEFORE UPDATE ON public.inventory_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample branch data
INSERT INTO public.branches (name, ip_address, location, status) VALUES
('Main Branch - Johannesburg', '192.168.1.100', 'Johannesburg, Gauteng', 'connected'),
('North Branch - Pretoria', '192.168.2.100', 'Pretoria, Gauteng', 'offline'),
('South Branch - Cape Town', '192.168.3.100', 'Cape Town, Western Cape', 'connected');