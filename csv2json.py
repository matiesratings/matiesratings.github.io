import csv
import json

def csv_to_json(csv_filename, json_filename):
    data = []
    
    with open(csv_filename, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        for row in csv_reader:
            row["maties_id"] = int(row["maties_id"])  # Convert ID to int
            row["rating"] = int(row["rating"])  # Convert rating to int
            row["birth_year"] = int(row["birth_year"])  # Convert birth year to int
            data.append(row)
    
    with open(json_filename, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4)
    
    print(f"Converted {csv_filename} to {json_filename}")

# Example usage
csv_to_json("playerdata.csv", "players.json")
