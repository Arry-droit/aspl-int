import os
import json
import csv
import scrapy
import parsel

class NewsSpider(scrapy.Spider):
    name = "news"

    start_urls = [
        "https://www.polymerupdate.com/News/Listing/pp",
        "https://www.polymerupdate.com/News/Listing/hdpe",
        "https://www.polymerupdate.com/News/Listing/ldpe",
        "https://www.polymerupdate.com/News/Listing/lldpe",
        "https://www.polymerupdate.com/News/Listing/pvc",
        "https://www.plastemart.com/"
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.seen_urls = set()
        self.new_items = []
        
        # Internal history database file to track seen items across runs
        self.history_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'history_database.json'))
        self.history_items = []

        # Load history
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r", encoding="utf-8") as f:
                    self.history_items = json.load(f)
                    self.seen_urls = {item["url"] for item in self.history_items if "url" in item}
                self.logger.info(f"Loaded {len(self.seen_urls)} history URLs from internal database.")
            except Exception as e:
                self.logger.warning(f"Could not load internal history database: {e}")

        # Virgin prices database config
        self.virgin_prices_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'virgin_prices.json'))
        self.virgin_prices_history = []
        self.scraped_virgin_prices = []

        if os.path.exists(self.virgin_prices_file):
            try:
                with open(self.virgin_prices_file, "r", encoding="utf-8") as f:
                    self.virgin_prices_history = json.load(f)
                self.logger.info(f"Loaded {len(self.virgin_prices_history)} virgin price records from history.")
            except Exception as e:
                self.logger.warning(f"Could not load virgin prices history: {e}")

    def parse(self, response):
        if 'plastemart.com' in response.url:
            sel = parsel.Selector(text=response.text)
            pp_excel_url = None
            pe_excel_url = None
            
            for a in sel.css('a'):
                href = a.attrib.get('href', '')
                text = " ".join([t.strip() for t in a.css('::text').getall() if t.strip()]).lower()
                if 'reliance' in text and href.lower().endswith('.xlsx'):
                    if 'sez' in text or 'sez' in href.lower():
                        continue
                    if 'pp' in text:
                        pp_excel_url = response.urljoin(href)
                    elif 'pe' in text or 'hdpe' in text or 'ldpe' in text or 'lldpe' in text:
                        pe_excel_url = response.urljoin(href)
                        
            if pp_excel_url:
                self.logger.info(f"Found Reliance PP Excel sheet URL: {pp_excel_url}")
                yield scrapy.Request(url=pp_excel_url, callback=self.parse_pp_excel, dont_filter=True)
            if pe_excel_url:
                self.logger.info(f"Found Reliance PE Excel sheet URL: {pe_excel_url}")
                yield scrapy.Request(url=pe_excel_url, callback=self.parse_pe_excel, dont_filter=True)
            return

        # Determine the category from the URL (e.g. pp, hdpe, ldpe, etc.)
        category = response.url.split("/")[-1].upper()
        
        sel = parsel.Selector(text=response.text)
        news_items = sel.css('.news-list')
        
        for item in news_items:
            href = item.css('a::attr(href)').get()
            if not href:
                continue
            
            full_url = response.urljoin(href)
            if full_url in self.seen_urls:
                continue

            # Initialize base item with category and URL
            base_item = {'category': category, 'url': full_url}
            yield scrapy.Request(full_url, callback=self.parse_article, meta={'item': base_item}, dont_filter=True)

        # Pagination for news listing pages
        next_page = sel.css('a.next::attr(href)').get()
        if next_page:
            yield response.follow(next_page, self.parse)

    def parse_article(self, response):
        # Retrieve accumulated item data from meta, if any
        item = response.meta.get('item', {})
        # Category may be stored in item or extracted from URL
        category = item.get('category') or response.meta.get('category')
        is_highlight = category.lower() in ['pp', 'hdpe'] if category else False

        # Extract article details from current page
        heading = response.css('h1::text').get() or response.css('title::text').get() or ''
        heading_clean = heading.strip().replace("\n", " ").replace("\r", " ")
        date_raw = response.css('.date::text').get() or ''
        date_clean = date_raw.strip()
        body_part = "\n".join(response.css('p::text').getall())

        # Initialize fields if not present
        if not item.get('article_heading'):
            item['article_heading'] = heading_clean
        if not item.get('article_date'):
            item['article_date'] = date_clean
        if not item.get('article_author'):
            # Attempt to extract author
            author = response.css('meta[name="author"]::attr(content)').get() or response.css('.author::text').get() or ''
            item['article_author'] = author.strip()

        # Accumulate body content across pages
        existing_body = item.get('article_body', '')
        combined_body = (existing_body + "\n" + body_part).strip() if existing_body else body_part.strip()
        item['article_body'] = combined_body

        # Prepare display title for news summary
        display_title = f"[HIGHLIGHT - {category}] {heading_clean}" if is_highlight else heading_clean

        # Build item data for news list (includes article fields)
        item_data = {
            "title": display_title,
            "date": date_clean,
            "url": response.url,
            "content": combined_body,
            "category": category,
            "highlighted": is_highlight,
            "article_heading": item.get('article_heading', ''),
            "article_date": item.get('article_date', ''),
            "article_author": item.get('article_author', ''),
            "article_body": item.get('article_body', '')
        }

        # Check for pagination within the article
        next_link = response.css('a:contains("Next"), a:contains("next"), a.pagination-next::attr(href)').xpath('string(.)').get()
        if not next_link:
            next_link = response.xpath('//a[@rel="next"]/@href').get()
        if next_link:
            next_url = response.urljoin(next_link)
            # Pass accumulated item forward
            yield scrapy.Request(url=next_url, callback=self.parse_article, meta={'item': item}, dont_filter=True)
        else:
            # No further pages, finalize and store
            self.new_items.append(item_data)
            self.seen_urls.add(response.url)
            yield item_data

    def parse_pp_excel(self, response):
        self.logger.info(f"Parsing PP Excel from {response.url}")
        try:
            import io
            import openpyxl
            import re
            wb = openpyxl.load_workbook(io.BytesIO(response.body), read_only=True)
            sheet = wb['Ex-Depot'] if 'Ex-Depot' in wb.sheetnames else wb.active
            
            # Extract date
            date_str = "Unknown"
            for col in range(1, 10):
                val = sheet.cell(row=4, column=col).value
                if val and "date" in str(val).lower():
                    m = re.search(r'date\s*:\s*([a-za-z]+\s+\d+\s*,\s*\d{4})', str(val), re.IGNORECASE)
                    if m:
                        date_str = m.group(1).strip()
                        break
                        
            # Find grades
            pp_delhi = self.find_grade_price(sheet, '103X', 'delhi')
            pp_mumbai = self.find_grade_price(sheet, '103X', 'mumbai')
            
            item = {
                "date": date_str,
                "material": "PP",
                "grade": "103X",
                "delhi_price_rs_mt": pp_delhi,
                "mumbai_price_rs_mt": pp_mumbai,
                "source": "Plastemart (Reliance Price List)",
                "file_url": response.url
            }
            self.logger.info(f"Extracted PP prices: {item}")
            self.scraped_virgin_prices.append(item)
            yield item
        except Exception as e:
            self.logger.error(f"Error parsing PP Excel: {e}")

    def parse_pe_excel(self, response):
        self.logger.info(f"Parsing PE Excel from {response.url}")
        try:
            import io
            import openpyxl
            import re
            wb = openpyxl.load_workbook(io.BytesIO(response.body), read_only=True)
            sheet = wb['Ex-Depot'] if 'Ex-Depot' in wb.sheetnames else wb.active
            
            # Extract date
            date_str = "Unknown"
            for col in range(1, 10):
                val = sheet.cell(row=4, column=col).value
                if val and "date" in str(val).lower():
                    m = re.search(r'date\s*:\s*([a-za-z]+\s+\d+\s*,\s*\d{4})', str(val), re.IGNORECASE)
                    if m:
                        date_str = m.group(1).strip()
                        break
                        
            # Find grades
            hdpe_delhi_52 = self.find_grade_price(sheet, '52GB002', 'delhi')
            hdpe_mumbai_52 = self.find_grade_price(sheet, '52GB002', 'mumbai')
            hdpe_delhi_46 = self.find_grade_price(sheet, '46GP009', 'delhi')
            hdpe_mumbai_46 = self.find_grade_price(sheet, '46GP009', 'mumbai')
            
            item_52 = {
                "date": date_str,
                "material": "HDPE",
                "grade": "52GB002",
                "delhi_price_rs_mt": hdpe_delhi_52,
                "mumbai_price_rs_mt": hdpe_mumbai_52,
                "source": "Plastemart (Reliance Price List)",
                "file_url": response.url
            }
            item_46 = {
                "date": date_str,
                "material": "HDPE",
                "grade": "46GP009",
                "delhi_price_rs_mt": hdpe_delhi_46,
                "mumbai_price_rs_mt": hdpe_mumbai_46,
                "source": "Plastemart (Reliance Price List)",
                "file_url": response.url
            }
            self.logger.info(f"Extracted PE prices: {item_52} and {item_46}")
            self.scraped_virgin_prices.append(item_52)
            self.scraped_virgin_prices.append(item_46)
            yield item_52
            yield item_46
        except Exception as e:
            self.logger.error(f"Error parsing PE Excel: {e}")

    def find_grade_price(self, sheet, target_grade, target_city):
        import re
        grade_row = None
        grade_col = None
        
        for r in range(1, 120):
            for c in range(1, 15):
                val = sheet.cell(row=r, column=c).value
                if val and str(val).strip().upper() == target_grade.upper():
                    grade_row = r
                    grade_col = c
                    break
            if grade_row is not None:
                break
                
        if grade_row is None:
            return None
            
        for r in range(grade_row + 1, grade_row + 50):
            c1 = sheet.cell(row=r, column=1).value
            city = sheet.cell(row=r, column=3).value
            depot = sheet.cell(row=r, column=4).value
            
            if c1 is None and city is None:
                break
            if c1 and "date" in str(c1).lower():
                break
                
            if target_city.lower() == 'delhi':
                if city and "delhi" in str(city).lower():
                    val = sheet.cell(row=r, column=grade_col).value
                    if val:
                        m_val = re.search(r'\d+', str(val))
                        if m_val:
                            return int(m_val.group(0))
            elif target_city.lower() == 'mumbai':
                if (city and "mumbai" in str(city).lower()) or (depot and "bhiwandi" in str(depot).lower()):
                    val = sheet.cell(row=r, column=grade_col).value
                    if val:
                        m_val = re.search(r'\d+', str(val))
                        if m_val:
                            return int(m_val.group(0))
        return None

    def closed(self, reason):
        # 1. Deduplicate and merge news items
        seen_news = set()
        merged_items = []
        for item in self.new_items:
            if item["url"] not in seen_news:
                merged_items.append(item)
                seen_news.add(item["url"])
        for item in self.history_items:
            if item.get("url") not in seen_news:
                merged_items.append(item)
                seen_news.add(item.get("url"))

        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(merged_items, f, indent=4, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Failed to write history database: {e}")

        # 2. Deduplicate and merge price items
        seen_prices = set()
        merged_prices = []
        for item in self.scraped_virgin_prices:
            key = (item["date"], item["material"], item["grade"])
            if key not in seen_prices:
                merged_prices.append(item)
                seen_prices.add(key)
        for item in self.virgin_prices_history:
            key = (item.get("date"), item.get("material"), item.get("grade"))
            if key not in seen_prices:
                merged_prices.append(item)
                seen_prices.add(key)

        try:
            with open(self.virgin_prices_file, "w", encoding="utf-8") as f:
                json.dump(merged_prices, f, separators=(',', ':'), ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Failed to write virgin_prices database: {e}")



        # 3. Build unified combined dataset
        # Find latest price for each (material, grade)
        latest_prices = {}
        for p in merged_prices:
            mat = p.get("material")
            grd = p.get("grade")
            if mat and grd:
                key = (mat, grd)
                if key not in latest_prices:
                    latest_prices[key] = p

        combined_rows = []
        for news in merged_items:
            cat = news.get("category", "").upper()
            
            matching_prices = []
            if cat == 'PP':
                matching_prices = [latest_prices.get(('PP', '103X'))]
            elif cat == 'HDPE':
                matching_prices = [
                    latest_prices.get(('HDPE', '52GB002')),
                    latest_prices.get(('HDPE', '46GP009'))
                ]
            else:
                matching_prices = [None]
                
            for p in matching_prices:
                row = {
                    "date": news.get("date", ""),
                    "material": "rPP" if cat == 'PP' else ("rHDPE" if cat == 'HDPE' else cat),
                    "news_summary": news.get("title", ""),
                    "market_analysis": news.get("content", ""),
                    "price_grade": p.get("grade", "") if p else "N/A",
                    "delhi_price_rs_mt": p.get("delhi_price_rs_mt", "") if p else "N/A",
                    "mumbai_price_rs_mt": p.get("mumbai_price_rs_mt", "") if p else "N/A",
                    "price_date": p.get("date", "") if p else "N/A",
                    "news_url": news.get("url", ""),
                    "article_heading": news.get("article_heading", ""),
                    "article_date": news.get("article_date", ""),
                    "article_author": news.get("article_author", ""),
                    "article_body": news.get("article_body", "")
                }
                combined_rows.append(row)

        # Write to data.json (minified, single line, no newlines)
        try:
            with open("data.json", "w", encoding="utf-8") as f:
                json.dump(combined_rows, f, separators=(',', ':'), ensure_ascii=False)
            self.logger.info(f"Successfully updated unified data.json (minified). Total combined items: {len(combined_rows)}")
        except Exception as e:
            self.logger.error(f"Failed to write unified data.json: {e}")

        # Write to data.csv
        try:
            with open("data.csv", "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["date", "material", "news_summary", "market_analysis", "price_grade", "delhi_price_rs_mt", "mumbai_price_rs_mt", "price_date", "news_url", "article_heading", "article_date", "article_author", "article_body"])
                writer.writeheader()
                for row in combined_rows:
                    writer.writerow(row)
            self.logger.info(f"Successfully updated unified data.csv. Total combined items: {len(combined_rows)}")
        except Exception as e:
            self.logger.error(f"Failed to write unified data.csv: {e}")