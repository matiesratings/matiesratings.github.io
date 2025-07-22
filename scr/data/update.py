import csv
import json
from pathlib import Path
import re
from datetime import datetime


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
                "maties_id": row["maties_id"],
                "name": row["name"],
                "club": row["club"],
                "rating": row["rating"],
                "played": row["played"],
                "win_per": row["win_per"],
                "won": row["won"],
                "lost": row["lost"],
                "last_played": row["last_played"]
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


def get_latest_historical_files(input_dir, output_dir):
    name_map = {
        "Boys U11": "bu11_ratings.json",
        "Boys U13": "bu13_ratings.json",
        "Boys U15": "bu15_ratings.json",
        "Boys U19": "bu19_ratings.json",
        "Girls U11": "gu11_ratings.json",
        "Girls U13": "gu13_ratings.json",
        "Girls U15": "gu15_ratings.json",
        "Girls U19": "gu19_ratings.json",
        "Open": "open_ratings.json",
        "Women's": "women_ratings.json"
    }

    latest_files = {}

    for path in input_dir.glob("*.json"):
        match = re.match(r"(.+?) Ratings \((\d{4}-\d{2}-\d{2})\)\.json", path.name)
        if not match:
            continue
        category, date_str = match.groups()
        if category not in name_map:
            continue

        date = datetime.strptime(date_str, "%Y-%m-%d")
        current_best = latest_files.get(category)
        if not current_best or date > current_best[0]:
            latest_files[category] = (date, path)

    for category, (date, path) in latest_files.items():
        output_path = output_dir / name_map[category]
        data = json.loads(path.read_text(encoding="utf-8"))
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Updated {output_path.name} from '{path.name}' (Date: {date.date()})")


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

    convert_csv_to_json(input_folder / "Player List (2025-07-09).csv", Path(output_folder / "all_players.json"))
    convert_matches(input_folder / "Match Results (2025-07-20).csv", Path(output_folder /"matches.json"))
    extract_clubs(Path(output_folder /"all_players.json"), Path(output_folder /"clubs.json"))
    get_latest_historical_files(output_folder / "historical", output_folder)





