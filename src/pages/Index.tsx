import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, Package, Server, Settings, Users, Wrench, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">QB Analytics</h1>
              </div>
              <Badge variant="secondary">Single User</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Connection Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>QuickBooks Servers</span>
              </CardTitle>
              <CardDescription>
                Connect to multiple QuickBooks 2021 servers across your tile business branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Johannesburg Main</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">192.168.1.100 • Gauteng</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Pretoria North</span>
                    <Badge variant="secondary">Offline</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">192.168.2.100 • Gauteng</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Cape Town South</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">192.168.3.100 • Western Cape</p>
                </div>
              </div>
              <Button className="mt-4">
                <Server className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R 845,231</div>
              <p className="text-xs text-muted-foreground">
                +15.2% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiles Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,450</div>
              <p className="text-xs text-muted-foreground">
                Ceramic: 65% • Porcelain: 35%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Turnover</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2x</div>
              <p className="text-xs text-muted-foreground">
                Improved efficiency
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">
                Retention rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Install Rate</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                On-time completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Business Alerts */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Business Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">Low Stock Alert</p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Marble tiles below reorder level at Cape Town branch</p>
                  </div>
                  <Badge variant="secondary">Action Required</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">High Demand</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Ceramic 600x600 tiles trending up across all branches</p>
                  </div>
                  <Badge variant="outline">Monitor</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance by Branch</CardTitle>
              <CardDescription>
                Monthly revenue comparison (ZAR)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Sales comparison chart</p>
                  <p className="text-sm text-muted-foreground">Johannesburg vs Cape Town</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Tile Styles</CardTitle>
              <CardDescription>
                Best performers this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ceramic 600x600 White</p>
                    <p className="text-sm text-muted-foreground">2,850 units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R 285,000</p>
                    <p className="text-sm text-green-600">+18% margin</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Porcelain 800x800 Grey</p>
                    <p className="text-sm text-muted-foreground">1,920 units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R 384,000</p>
                    <p className="text-sm text-green-600">+22% margin</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marble 450x450 Beige</p>
                    <p className="text-sm text-muted-foreground">780 units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R 156,000</p>
                    <p className="text-sm text-green-600">+15% margin</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>
                Current stock levels across branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Stock</span>
                  <span className="font-medium text-green-600">89%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Low Stock</span>
                  <span className="font-medium text-orange-600">8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dead Stock</span>
                  <span className="font-medium text-red-600">3%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Installation Efficiency</CardTitle>
              <CardDescription>
                Project completion metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">On Schedule</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Delayed</span>
                  <span className="font-medium text-orange-600">6%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cancelled</span>
                  <span className="font-medium text-red-600">2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>
                Customer acquisition channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Referrals</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Online</span>
                  <span className="font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Walk-ins</span>
                  <span className="font-medium">23%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;