import { useEffect, useState } from "react";
import { getMarketDataItems, getMaterialsList, parsePrice } from "@/services/dataService";
import type { MarketDataItem } from "@/services/dataService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter } from "lucide-react";

export function Trends() {
  const [data, setData] = useState<MarketDataItem[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const items = await getMarketDataItems();
      const mats = await getMaterialsList();
      
      // Default to top 3 materials if available
      const initialSelected = mats.slice(0, 3);
      
      setData(items);
      setMaterials(mats);
      setSelectedMaterials(initialSelected);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading trends data...</div>;
  }

  // Group data by date
  const dateMap = new Map<string, any>();
  
  data.forEach(item => {
    if (!selectedMaterials.includes(item.material || "")) return;
    
    const date = item.price_date || item.date;
    if (!date || date.toUpperCase() === 'N/A') return;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return;
    
    // Normalize date string for grouping
    const dateStr = parsedDate.toLocaleDateString();
    
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, dateObj: parsedDate });
    }
    
    const entry = dateMap.get(dateStr);
    const priceVal = parsePrice(item.delhi_price_rs_mt);
    if (priceVal > 0) {
      entry[item.material!] = priceVal;
    }
  });

  const chartData = Array.from(dateMap.values())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  const toggleMaterial = (mat: string) => {
    if (selectedMaterials.includes(mat)) {
      setSelectedMaterials(selectedMaterials.filter(m => m !== mat));
    } else {
      if (selectedMaterials.length < 5) {
        setSelectedMaterials([...selectedMaterials, mat]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Trends</h1>
          <p className="text-muted-foreground mt-1">Compare historical pricing across different materials.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6 text-sm font-medium">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span>Select materials to compare (max 5):</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {materials.map(mat => (
            <button
              key={mat}
              onClick={() => toggleMaterial(mat)}
              disabled={!selectedMaterials.includes(mat) && selectedMaterials.length >= 5}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedMaterials.includes(mat)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {mat}
            </button>
          ))}
        </div>

        <div className="h-[500px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {selectedMaterials.map((mat, i) => (
                  <Line 
                    key={mat}
                    type="stepAfter" 
                    dataKey={mat} 
                    name={mat}
                    stroke={colors[i % colors.length]} 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              Select materials with historical data to view trends.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
