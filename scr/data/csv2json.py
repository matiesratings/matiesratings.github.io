import csv
import json
import os

def ratings_csv_to_json(input_path, output_filename):
    with open(input_path, mode='r', encoding='utf-8-sig') as csv_file:
        reader = csv.DictReader(csv_file, delimiter=',')  # Tab-delimited
        data = []
        for row in reader:
            player = {
                "maties_id": row["ID"],
                "name": row["Name"],
                "club": row["Club"],
                "rating": row["Rating"],
                "played": row["Played"],
                "win_per": row["Win %"],
                "last_played": row["Last Played"]
            }
            data.append(player)

    with open(output_filename, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=2)

def matches_csv_to_json(csv_filename, json_filename):
    # Get the current directory of the Python script
    current_directory = os.path.dirname(os.path.realpath(__file__))
    
    # Join the current directory with the filenames
    csv_filepath = os.path.join(current_directory, csv_filename)
    json_filepath = os.path.join(current_directory, json_filename)
    
    matches = []
    
    with open(csv_filepath, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        for row in csv_reader:
            match = {
                "match_id": row["match_id"],
                "match_date": row["match_date"],
                "event_name": row["event_name"],
                "event_type": row["event_type"],
                "category": row.get("category", "Open League"),
                "province": row["province"],
                "stage": row["stage"],
                "winner": row["p1_name"] if int(row["p1_score"]) > int(row["p2_score"]) else row["p2_name"],
                "loser": row["p2_name"] if int(row["p1_score"]) > int(row["p2_score"]) else row["p1_name"],
                "score": f"{max(int(row['p1_score']), int(row['p2_score']))}-{min(int(row['p1_score']), int(row['p2_score']))}"
            }
            matches.append(match)
    
    with open(json_filepath, mode='w', encoding='utf-8') as json_file:
        json.dump(matches, json_file, indent=4)
    
    print(f"Converted {csv_filename} to {json_filename}")

def csv_to_json(input_path, output_filename):
    with open(input_path, mode='r', newline='', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        data = list(reader)

    with open(output_filename, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=2)




# csv_to_json("final/Player List (2025-04-11).csv","all_players.json")
# matches_csv_to_json("final/Match Results (2025-04-11).csv", "matches.json")
ratings_csv_to_json("final/Open Ratings (2025-04-11).csv","open_ratings.json")