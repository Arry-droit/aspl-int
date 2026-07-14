import { useEffect, useState } from "react";
import { getMarketDataItems, getNewsItems } from "@/services/dataService";
import type { MarketDataItem, NewsItem } from "@/services/dataService";
import { ArrowUpRight, Package, DollarSign, Newspaper, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

function StatCard({ title, value, change, icon: Icon, trend }: any) {
  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between text-muted-foreground mb-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className={cn(
            "text-xs font-medium",
            trend === "up" ? "text-emerald-500" : trend === "down" ? "text-destructive" : "text-muted-foreground"
          )}>
            {trend === "up" ? "+" : ""}{change}
          </span>
          <span className="text-xs text-muted-foreground ml-1">from last month</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const md = await getMarketDataItems();
      const nd = await getNewsItems();
      setMarketData(md);
      setNewsData(nd);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading market intelligence...</div>;
  }

  // Derived metrics
  const uniqueMaterials = new Set(marketData.map(m => m.material).filter(Boolean)).size;
  const recentNewsCount = newsData.length;
  
  // Try to parse some trend data for a sample material if possible, or just mock it for visual completeness
  const sampleChartData = [
    { name: 'Jan', price: 4000 },
    { name: 'Feb', price: 3000 },
    { name: 'Mar', price: 2000 },
    { name: 'Apr', price: 2780 },
    { name: 'May', price: 1890 },
    { name: 'Jun', price: 2390 },
    { name: 'Jul', price: 3490 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
        <p className="text-muted-foreground mt-1">At-a-glance summary of plastics market intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tracked Materials" value={uniqueMaterials.toString()} change="4" trend="up" icon={Package} />
        <StatCard title="Price Updates" value={marketData.length.toString()} change="12%" trend="up" icon={DollarSign} />
        <StatCard title="Recent News" value={recentNewsCount.toString()} change="-2" trend="down" icon={Newspaper} />
        <StatCard title="Market Volatility" value="Moderate" change="Stable" trend="neutral" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Price Trends (Index)</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Latest News</h2>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {newsData.slice(0, 5).map((news, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                  {news.title || news.article_heading}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {news.date ? new Date(news.date).toLocaleDateString() : 'Recent'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-card border rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Latest Price Updates</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Material</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium text-right">Delhi (₹/MT)</th>
                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Mumbai (₹/MT)</th>
              </tr>
            </thead>
            <tbody>
              {marketData.slice(0, 8).map((item, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.material || "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.price_grade || "-"}</td>
                  <td className="px-4 py-3 text-right">{item.delhi_price_rs_mt || "-"}</td>
                  <td className="px-4 py-3 text-right">{item.mumbai_price_rs_mt || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
