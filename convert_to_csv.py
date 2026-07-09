import json
import csv
import os

def convert_json_to_csv():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "combined_data.json")
    csv_path = os.path.join(base_dir, "combined_data.csv")

    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist.")
        return

    print("Loading JSON data...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("Error: JSON content is not a list.")
        return

    print(f"Loaded {len(data)} items. Analyzing keys...")
    
    # Identify all unique keys
    all_keys = set()
    key_counts = {}
    for item in data:
        if isinstance(item, dict):
            for k in item.keys():
                all_keys.add(k)
                key_counts[k] = key_counts.get(k, 0) + 1

    print("Keys found and their frequencies:")
    for k in sorted(all_keys):
        print(f"  - {k}: {key_counts[k]} occurrences")

    # Order keys logically (e.g. putting title/date/url first if they exist)
    preferred_order = ["title", "date", "url", "news_url", "file_url", "article_heading", "content"]
    headers = [k for k in preferred_order if k in all_keys]
    headers.extend(sorted(list(all_keys - set(headers))))

    print(f"Writing to CSV with headers: {headers}")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
        writer.writeheader()
        for item in data:
            if isinstance(item, dict):
                # Clean up content field if it has newlines or complex text
                # dictwriter handles escaping, but let's make sure it writes correctly.
                writer.writerow(item)

    print(f"Successfully wrote {len(data)} rows to {csv_path}")

if __name__ == "__main__":
    convert_json_to_csv()
