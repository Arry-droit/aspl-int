import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMarketDataItems, formatDate } from "@/services/dataService";
import type { MarketDataItem } from "@/services/dataService";
import { Search, Filter, ChevronRight } from "lucide-react";

export function Materials() {
  const [data, setData] = useState<MarketDataItem[]>([]);
  const [filtered, setFiltered] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      const items = await getMarketDataItems();
      // Group by material to get the latest unique materials
      const uniqueMap = new Map<string, MarketDataItem>();
      items.forEach(item => {
        if (item.material) {
          if (!uniqueMap.has(item.material)) {
            uniqueMap.set(item.material, item);
          } else {
            // Keep the one with the latest date if multiple exist
            const existing = uniqueMap.get(item.material);
            if (existing && item.date && existing.date && new Date(item.date) > new Date(existing.date)) {
              uniqueMap.set(item.material, item);
            }
          }
        }
      });
      
      const uniqueMaterials = Array.from(uniqueMap.values()).sort((a, b) => 
        (a.material || "").localeCompare(b.material || "")
      );
      
      setData(uniqueMaterials);
      setFiltered(uniqueMaterials);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = data.filter(item => 
      item.material?.toLowerCase().includes(term) || 
      item.price_grade?.toLowerCase().includes(term)
    );
    setFiltered(result);
  }, [searchTerm, data]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading materials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials Database</h1>
          <p className="text-muted-foreground mt-1">Browse and filter all tracked plastics and resins.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search materials or grades..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-6 py-4 font-medium">Material</th>
                <th className="px-6 py-4 font-medium">Grade</th>
                <th className="px-6 py-4 font-medium text-right">Delhi (₹/MT)</th>
                <th className="px-6 py-4 font-medium text-right">Mumbai (₹/MT)</th>
                <th className="px-6 py-4 font-medium text-right">Last Updated</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground">{item.material}</td>
                  <td className="px-6 py-4 text-muted-foreground">{item.price_grade || "-"}</td>
                  <td className="px-6 py-4 text-right font-mono">{item.delhi_price_rs_mt || "-"}</td>
                  <td className="px-6 py-4 text-right font-mono">{item.mumbai_price_rs_mt || "-"}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {formatDate(item.price_date || item.date)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/materials/${encodeURIComponent(item.material || "")}`}
                      className="inline-flex items-center justify-center p-2 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No materials found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between items-center">
          <span>Showing {filtered.length} of {data.length} materials</span>
        </div>
      </div>
    </div>
  );
}
