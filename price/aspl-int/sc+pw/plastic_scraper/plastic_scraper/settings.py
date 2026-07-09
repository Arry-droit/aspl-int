BOT_NAME = "plastic_scraper"

SPIDER_MODULES = ["plastic_scraper.spiders"]
NEWSPIDER_MODULE = "plastic_scraper.spiders"

# Use a realistic User-Agent to prevent 403 Forbidden blocks
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Obey robots.txt rules
ROBOTSTXT_OBEY = False