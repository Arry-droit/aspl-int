import { useEffect, useState } from "react";
import { getNewsItems, formatDate } from "@/services/dataService";
import type { NewsItem } from "@/services/dataService";
import { Search, ExternalLink, Calendar, User, Newspaper } from "lucide-react";

export function News() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [filtered, setFiltered] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      const items = await getNewsItems();
      // Sort by date descending
      items.sort((a, b) => {
        const d1 = new Date(a.date || a.article_date || 0).getTime();
        const d2 = new Date(b.date || b.article_date || 0).getTime();
        return d2 - d1;
      });
      setData(items);
      setFiltered(items);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = data.filter(item => {
      const title = (item.title || item.article_heading || "").toLowerCase();
      const content = (item.content || item.article_body || "").toLowerCase();
      return title.includes(term) || content.includes(term);
    });
    setFiltered(result);
  }, [searchTerm, data]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading news...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market News</h1>
          <p className="text-muted-foreground mt-1">Latest updates and articles across the plastics industry.</p>
        </div>
        <div className="relative w-full sm:w-auto min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search news..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, i) => (
          <div key={i} className="bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden hover:border-primary/50 transition-colors group">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.date || item.article_date) !== '-' ? formatDate(item.date || item.article_date) : "Recent"}
                </span>
                {item.article_author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.article_author}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {item.title || item.article_heading}
              </h2>
              <p className="text-muted-foreground text-sm flex-1 line-clamp-4">
                {item.content || item.article_body || "No summary available."}
              </p>
            </div>
            {(item.url || item.news_url) && (
              <div className="px-6 py-4 border-t bg-muted/10 mt-auto">
                <a 
                  href={item.url || item.news_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Read full article <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="bg-card border rounded-xl p-12 text-center shadow-sm">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">No news found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
}
