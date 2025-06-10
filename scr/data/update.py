import csv
import json
from pathlib import Path

# === Utilities ===

def ensure_empty_json_files(filenames, folder=Path(".")):
    folder.mkdir(parents=True, exist_ok=True)
    for name in filenames:
        file_path = folder / name
        if not file_path.exists():
            file_path.write_text("[]", encoding="utf-8")

def convert_csv_to_json(input_path, output_path):
    with open(input_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        data = []

        for row in reader:
            for key, value in row.items():
                if value.isdigit():
                    row[key] = int(value)
                elif value.replace('.', '', 1).isdigit() and value.count('.') < 2:
                    row[key] = float(value)
            data.append(row)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# === Conversion Logic ===

def convert_ratings(input_path, output_path):
    with open(input_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        data = []

        for row in reader:
            data.append({
                "maties_id": row["ID"],
                "name": row["Name"],
                "club": row["Club"],
                "rating": row["Rating"],
                "played": row["Played"],
                "win_per": row["Win %"]
            })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def convert_matches(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        matches = []

        for row in reader:
            p1_score, p2_score = int(row["p1_score"]), int(row["p2_score"])
            match = {
                "match_id": row["match_id"],
                "match_date": row["match_date"],
                "event_name": row["event_name"],
                "event_type": row["event_type"],
                "category": row.get("category", "Open League"),
                "province": row["province"],
                "stage": row["stage"],
                "winner": row["p1_name"] if p1_score > p2_score else row["p2_name"],
                "loser": row["p2_name"] if p1_score > p2_score else row["p1_name"],
                "score": f"{max(p1_score, p2_score)}-{min(p1_score, p2_score)}"
            }
            matches.append(match)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=2)

def extract_clubs(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        players = json.load(f)

    clubs = sorted({player["club"] for player in players})

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"clubs": clubs}, f, indent=2)

# === Main Script ===

if __name__ == "__main__":
    input_folder = Path("csv")
    output_folder = Path("json")
    ensure_empty_json_files([
        "open_ratings.json", "women_ratings.json",
        "bu19_ratings.json", "gu19_ratings.json",
        "bu15_ratings.json", "gu15_ratings.json",
        "bu13_ratings.json", "gu13_ratings.json",
        "bu11_ratings.json", "gu11_ratings.json"
    ], output_folder)

    convert_csv_to_json(input_folder / "Player List (2025-06-09).csv", Path(output_folder / "all_players.json"))
    # convert_matches(input_folder / "Match Results (2025-06-09).csv", Path(output_folder /"matches.json"))
    extract_clubs(Path(output_folder /"all_players.json"), Path(output_folder /"clubs.json"))
    convert_ratings(input_folder/"Open Ratings (2025-06-09).csv", Path(output_folder / "open_ratings.json"))

    with open('json/matches.json', 'r') as f:
        data = json.load(f)

    print(f"Total matches: {len(data)}")




