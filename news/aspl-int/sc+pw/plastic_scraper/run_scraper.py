import subprocess
import time
import sys

def run_spider():
    print("\n--- Starting Scrapy Crawl ---")
    # Run the scrapy command as a subprocess using the current python executable
    # This avoids reactor restart issues in Twisted and runs in a clean process each time.
    result = subprocess.run(
        [sys.executable, "-m", "scrapy", "crawl", "news"],
        capture_output=False,
        text=True
    )
    if result.returncode == 0:
        print("Scrapy Crawl completed successfully.")
    else:
        print(f"Scrapy Crawl failed with exit code {result.returncode}.")

if __name__ == "__main__":
    print("Starting news scraper loop (Ctrl+C to stop)...")
    while True:
        try:
            run_spider()
        except KeyboardInterrupt:
            print("\nScraper loop stopped by user.")
            break
        except Exception as e:
            print(f"Unexpected error in runner: {e}")

        print("Waiting 15 seconds before next crawl...")
        time.sleep(15)