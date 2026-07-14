export interface NewsItem {
  title?: string;
  date?: string;
  url?: string;
  content?: string;
  news_url?: string;
  article_heading?: string;
  article_date?: string;
  article_author?: string;
  article_body?: string;
}

export interface MarketDataItem {
  date?: string;
  material?: string;
  news_summary?: string;
  market_analysis?: string;
  price_grade?: string;
  delhi_price_rs_mt?: string | number;
  mumbai_price_rs_mt?: string | number;
  price_date?: string;
}

export function parsePrice(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.trim();
    if (clean === '' || clean.toUpperCase() === 'N/A') return 0;
    const parsed = parseFloat(clean.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr.toUpperCase() === 'N/A') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
  } catch {
    return '-';
  }
}

export type CombinedDataItem = NewsItem & MarketDataItem;

let cachedData: CombinedDataItem[] | null = null;

export async function fetchCombinedData(): Promise<CombinedDataItem[]> {
  if (cachedData) return cachedData;
  try {
    // In dev mode, we can fetch from the public folder or absolute URL if served
    const response = await fetch('/combined_data.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.error("Error loading combined_data.json", error);
    return [];
  }
}

export async function getNewsItems(): Promise<NewsItem[]> {
  const data = await fetchCombinedData();
  // Simple heuristic: items that have a 'title' or 'article_heading' and no 'material'
  return data.filter(item => (item.title || item.article_heading) && !item.material);
}

export async function getMarketDataItems(): Promise<MarketDataItem[]> {
  const data = await fetchCombinedData();
  // Items that have a 'material'
  return data.filter(item => !!item.material);
}

export async function getMaterialsList(): Promise<string[]> {
  const marketData = await getMarketDataItems();
  const materials = new Set(marketData.map(item => item.material).filter(Boolean) as string[]);
  return Array.from(materials).sort();
}
