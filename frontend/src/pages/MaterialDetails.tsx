import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMarketDataItems, parsePrice, formatDate } from "@/services/dataService";
import type { MarketDataItem } from "@/services/dataService";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

export function MaterialDetails() {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const items = await getMarketDataItems();
      const materialHistory = items.filter(item => item.material === id)
                                   .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      
      setHistory(materialHistory);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading details...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="space-y-4">
        <Link to="/materials" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Materials
        </Link>
        <div className="flex items-center justify-center h-64 text-muted-foreground bg-card border rounded-xl shadow-sm">
          Material not found.
        </div>
      </div>
    );
  }

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  const latestDelhi = parsePrice(latest.delhi_price_rs_mt);
  const prevDelhi = previous ? parsePrice(previous.delhi_price_rs_mt) : latestDelhi;
  
  const percentChange = prevDelhi ? ((latestDelhi - prevDelhi) / prevDelhi * 100).toFixed(2) : "0.00";
  const isUp = parseFloat(percentChange) > 0;
  const isDown = parseFloat(percentChange) < 0;

  // Prepare chart data
  const chartData = history.map(item => ({
    date: formatDate(item.date),
    price: parsePrice(item.delhi_price_rs_mt)
  })).filter(d => d.price > 0);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/materials" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Materials
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{latest.material}</h1>
            <p className="text-muted-foreground mt-1">Grade: {latest.price_grade || "N/A"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Latest Delhi Price</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-mono text-foreground">₹{latest.delhi_price_rs_mt || "-"}</span>
              {isUp && <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md text-sm font-medium"><TrendingUp className="w-4 h-4 mr-1"/> +{percentChange}%</div>}
              {isDown && <div className="flex items-center text-destructive bg-destructive/10 px-2 py-1 rounded-md text-sm font-medium"><TrendingDown className="w-4 h-4 mr-1"/> {percentChange}%</div>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last updated: {formatDate(latest.price_date || latest.date)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Price History (Delhi)</h2>
          <div className="h-[400px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="stepAfter" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Not enough historical data for charting.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Latest Analysis</h2>
            {latest.market_analysis ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{latest.market_analysis}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No market analysis available for this material.</p>
            )}
          </div>
          
          <div className="bg-card border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Related News</h2>
            {latest.news_summary ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{latest.news_summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No recent news available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
