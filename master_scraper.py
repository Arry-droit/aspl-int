import os
import json
import time
import subprocess
import sys
import csv

def get_file_mtime(filepath):
    try:
        return os.path.getmtime(filepath)
    except OSError:
        return 0

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []

def save_csv(data, filepath):
    try:
        all_keys = set()
        for item in data:
            if isinstance(item, dict):
                all_keys.update(item.keys())
        
        preferred_order = ["title", "date", "url", "news_url", "file_url", "article_heading", "content"]
        headers = [k for k in preferred_order if k in all_keys]
        headers.extend(sorted(list(all_keys - set(headers))))
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
            writer.writeheader()
            for item in data:
                if isinstance(item, dict):
                    writer.writerow(item)
    except Exception as e:
        print(f"Error writing CSV to {filepath}: {e}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    news_dir = os.path.join(base_dir, "news", "aspl-int", "sc+pw", "plastic_scraper")
    price_dir = os.path.join(base_dir, "price", "aspl-int", "sc+pw", "plastic_scraper")
    
    news_json_path = os.path.join(news_dir, "data.json")
    price_json_path = os.path.join(price_dir, "data.json")
    combined_json_path = os.path.join(base_dir, "combined_data.json")
    combined_csv_path = os.path.join(base_dir, "combined_data.csv")

    print("Starting news scraper...")
    news_proc = subprocess.Popen([sys.executable, "run_scraper.py"], cwd=news_dir)
    
    print("Starting price scraper...")
    price_proc = subprocess.Popen([sys.executable, "run_scraper.py"], cwd=price_dir)

    last_news_mtime = 0
    last_price_mtime = 0

    print("Master loop started. Checking for updates every 5 seconds. Press Ctrl+C to stop.")
    
    try:
        while True:
            current_news_mtime = get_file_mtime(news_json_path)
            current_price_mtime = get_file_mtime(price_json_path)
            
            # If either file is updated
            if current_news_mtime != last_news_mtime or current_price_mtime != last_price_mtime:
                print("Update detected in source JSON files. Merging...")
                
                news_data = load_json(news_json_path)
                price_data = load_json(price_json_path)
                
                combined_data = []
                seen_keys = set()
                
                # Process news data
                for item in news_data:
                    # Use URL as unique key, fallback to title
                    key = item.get("url", item.get("title", ""))
                    if key and key not in seen_keys:
                        combined_data.append(item)
                        seen_keys.add(key)
                    elif not key:
                        str_rep = str(item)
                        if str_rep not in seen_keys:
                            combined_data.append(item)
                            seen_keys.add(str_rep)
                        
                # Process price data
                for item in price_data:
                    # price items may use news_url, file_url, or article_heading
                    key = item.get("news_url") or item.get("file_url") or item.get("article_heading", "")
                    
                    if key and key not in seen_keys:
                        combined_data.append(item)
                        seen_keys.add(key)
                    elif not key:
                        str_rep = str(item)
                        if str_rep not in seen_keys:
                            combined_data.append(item)
                            seen_keys.add(str_rep)
                
                # Write combined JSON
                try:
                    with open(combined_json_path, 'w', encoding='utf-8') as f:
                        json.dump(combined_data, f, indent=4, ensure_ascii=False)
                    print(f"Successfully updated {combined_json_path} with {len(combined_data)} total items.")
                except Exception as e:
                    print(f"Error writing combined JSON: {e}")
                
                # Write combined CSV
                save_csv(combined_data, combined_csv_path)
                    
                last_news_mtime = current_news_mtime
                last_price_mtime = current_price_mtime
                
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nStopping master script and terminating scrapers...")
        news_proc.terminate()
        price_proc.terminate()
        news_proc.wait()
        price_proc.wait()
        print("Done.")

if __name__ == "__main__":
    main()
