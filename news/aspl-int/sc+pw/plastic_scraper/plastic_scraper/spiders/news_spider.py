import os
import json
import csv
import scrapy
import parsel

class NewsSpider(scrapy.Spider):
    name = "news"

    # Start with page 1 of category 16 (Plastics)
    start_urls = [
        "https://resource-recycling.com/wp-json/wp/v2/posts?categories=16&per_page=100&page=1"
    ]

    def __init__(self, crawl_all=False, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.crawl_all = str(crawl_all).lower() in ['true', '1', 'yes']
        self.seen_urls = set()
        self.new_items = []

        # Load existing data to perform deduplication and build existing seen set
        if os.path.exists("data.json"):
            try:
                with open("data.json", "r", encoding="utf-8") as f:
                    existing_items = json.load(f)
                    self.seen_urls = {item["url"] for item in existing_items if "url" in item}
                self.logger.info(f"Loaded {len(self.seen_urls)} existing URLs from data.json.")
            except Exception as e:
                self.logger.warning(f"Could not load existing data.json for seen_urls check: {e}")

    def parse(self, response):
        try:
            posts = json.loads(response.text)
        except Exception as e:
            self.logger.error(f"Failed to parse JSON from {response.url}: {e}")
            return

        for post in posts:
            url = post.get("link", "")
            if not url or url in self.seen_urls:
                continue

            title = post.get("title", {}).get("rendered", "")
            # Decode HTML entities
            title = parsel.Selector(text=title).xpath('//text()').get() or title
            date = post.get("date", "")
            
            content_html = post.get("content", {}).get("rendered", "")
            if content_html:
                sel = parsel.Selector(text=content_html)
                paragraphs = sel.xpath('//text()').getall()
                content_text = "\n".join([p.strip() for p in paragraphs if p.strip()])
            else:
                content_text = ""

            item = {
                "title": title.strip(),
                "date": date,
                "url": url,
                "content": content_text.strip()
            }
            
            # Save new item to in-memory list
            self.new_items.append(item)
            self.seen_urls.add(url)
            
            # Yield item so Scrapy logs and outputs it in standard fashion
            yield item

        # Handle pagination using the X-WP-TotalPages header (if crawl_all is True)
        if self.crawl_all:
            total_pages_header = response.headers.get("X-WP-TotalPages")
            if total_pages_header:
                try:
                    total_pages = int(total_pages_header)
                except ValueError:
                    total_pages = 1

                current_page = 1
                if "page=" in response.url:
                    try:
                        parts = response.url.split("page=")
                        current_page = int(parts[-1].split("&")[0])
                    except Exception:
                        pass

                # If we are on the first page, request all remaining pages
                if current_page == 1:
                    self.logger.info(f"Crawl All active. Queueing remaining {total_pages - 1} pages...")
                    for page in range(2, total_pages + 1):
                        next_url = f"https://resource-recycling.com/wp-json/wp/v2/posts?categories=16&per_page=100&page={page}"
                        yield scrapy.Request(url=next_url, callback=self.parse)

    def closed(self, reason):
        # If no new items are scraped, do not overwrite files to avoid touching files/wasting IO
        if not self.new_items:
            self.logger.info("No new articles found. JSON and CSV files are up-to-date.")
            return

        self.logger.info(f"Scraped {len(self.new_items)} new items. Merging with existing data...")

        # Load existing items to merge
        existing_items = []
        if os.path.exists("data.json"):
            try:
                with open("data.json", "r", encoding="utf-8") as f:
                    existing_items = json.load(f)
            except Exception as e:
                self.logger.warning(f"Could not load existing data.json on close: {e}")

        # Combine items: newly scraped items are added to the beginning (most recent first)
        seen = set()
        merged_items = []
        
        for item in self.new_items:
            if item["url"] not in seen:
                merged_items.append(item)
                seen.add(item["url"])

        for item in existing_items:
            if item.get("url") not in seen:
                merged_items.append(item)
                seen.add(item.get("url"))

        # Write to JSON
        try:
            with open("data.json", "w", encoding="utf-8") as f:
                json.dump(merged_items, f, indent=4, ensure_ascii=False)
            self.logger.info(f"Successfully updated data.json. Total items: {len(merged_items)}")
        except Exception as e:
            self.logger.error(f"Failed to write data.json: {e}")

        # Write to CSV
        try:
            with open("data.csv", "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["title", "date", "url", "content"])
                writer.writeheader()
                for item in merged_items:
                    writer.writerow({
                        "title": item.get("title", ""),
                        "date": item.get("date", ""),
                        "url": item.get("url", ""),
                        "content": item.get("content", "")
                    })
            self.logger.info(f"Successfully updated data.csv. Total items: {len(merged_items)}")
        except Exception as e:
            self.logger.error(f"Failed to write data.csv: {e}")