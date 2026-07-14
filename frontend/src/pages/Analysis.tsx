import { useEffect, useState } from "react";
import { getMarketDataItems, formatDate } from "@/services/dataService";
import type { MarketDataItem } from "@/services/dataService";
import { BarChart2, Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Analysis() {
  const [data, setData] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const items = await getMarketDataItems();
      // Get latest analysis for each material
      const analysisMap = new Map<string, MarketDataItem>();
      items.forEach(item => {
        if (item.material && item.market_analysis) {
          const current = analysisMap.get(item.material);
          if (!current || new Date(item.date || 0) > new Date(current.date || 0)) {
            analysisMap.set(item.material, item);
          }
        }
      });
      setData(Array.from(analysisMap.values()));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading analysis...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
        <p className="text-muted-foreground mt-1">Deep dives and expert commentary on specific materials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, i) => (
          <div key={i} className="bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden hover:border-primary/50 transition-colors group">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                  {item.material}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.date) !== '-' ? formatDate(item.date) : "Recent"}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1 whitespace-pre-wrap line-clamp-6">
                {item.market_analysis}
              </p>
            </div>
            <div className="px-6 py-4 border-t bg-muted/10 mt-auto">
              <Link 
                to={`/materials/${encodeURIComponent(item.material || "")}`}
                className="inline-flex items-center text-sm font-medium text-primary group-hover:underline"
              >
                View Material Details <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="col-span-full bg-card border rounded-xl p-12 text-center shadow-sm">
            <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-1">No analysis found</h3>
            <p className="text-muted-foreground">There is no structured market analysis data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
