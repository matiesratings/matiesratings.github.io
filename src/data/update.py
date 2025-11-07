import csv
import json
from pathlib import Path
import re
from datetime import datetime

# === Configuration ===
# Paths are relative to the script location (src/data/)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
CSV_FOLDER = SCRIPT_DIR / "csv"
JSON_FOLDER = SCRIPT_DIR / "json"
HISTORICAL_FOLDER = JSON_FOLDER / "historical"

# Default date for file matching (update this when processing new files)
DEFAULT_DATE = "2025-11-02"

# Category name mapping for historical file processing
CATEGORY_NAME_MAP = {
    "Boys U11": "bu11_ratings.json",
    "Boys U13": "bu13_ratings.json",
    "Boys U15": "bu15_ratings.json",
    "Boys U19": "bu19_ratings.json",
    "Girls U11": "gu11_ratings.json",
    "Girls U13": "gu13_ratings.json",
    "Girls U15": "gu15_ratings.json",
    "Girls U19": "gu19_ratings.json",
    "Open": "open_ratings.json",
    "Women's": "women_ratings.json",
    "Men's": "men_ratings.json",
    "Men's Vets 40+": "mo40_ratings.json",
    "Men's Vets 50+": "mo50_ratings.json",
    "Men's Vets 60+": "mo60_ratings.json"
}

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


def get_latest_historical_files(input_dir=None, output_dir=None):
    """
    Processes historical rating files and extracts the latest version of each category.
    Copies the most recent rating files from historical folder to main JSON folder.
    
    Args:
        input_dir: Directory containing historical files (default: HISTORICAL_FOLDER)
        output_dir: Directory to write output files (default: JSON_FOLDER)
    """
    if input_dir is None:
        input_dir = HISTORICAL_FOLDER
    if output_dir is None:
        output_dir = JSON_FOLDER
    
    if not input_dir.exists():
        print(f"Historical folder not found: {input_dir}")
        return
    
    latest_files = {}
    files_processed = 0

    # Find the most recent file for each category
    for path in input_dir.glob("*.json"):
        # Match pattern like "Men's Ratings (2025-11-02).json"
        match = re.match(r"(.+?) Ratings \((\d{4}-\d{2}-\d{2})\)\.json", path.name)
        if not match:
            continue
        category, date_str = match.groups()
        if category not in CATEGORY_NAME_MAP:
            continue

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d")
            current_best = latest_files.get(category)
            if not current_best or date > current_best[0]:
                latest_files[category] = (date, path)
        except ValueError:
            continue

    # Copy the latest files to the output directory
    for category, (date, path) in latest_files.items():
        output_path = output_dir / CATEGORY_NAME_MAP[category]
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Updated {output_path.name} from '{path.name}' (Date: {date.date()})")
            files_processed += 1
        except Exception as e:
            print(f"Error processing {path.name}: {e}")
    
    if files_processed == 0:
        print("No rating files found in historical folder.")
    else:
        print(f"Processed {files_processed} rating file(s).")


# === Main Script ===

if __name__ == "__main__":
    import sys
    
    # Ensure directories exist
    CSV_FOLDER.mkdir(parents=True, exist_ok=True)
    JSON_FOLDER.mkdir(parents=True, exist_ok=True)
    
    # Get date from command line argument or use default
    date_str = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DATE
    print(f"Processing files with date: {date_str}")
    
    # File paths
    player_list_file = CSV_FOLDER / f"Player List ({date_str}).csv"
    match_results_file = CSV_FOLDER / f"Match Results ({date_str}).csv"
    
    all_players_output = JSON_FOLDER / "all_players.json"
    matches_output = JSON_FOLDER / "matches.json"
    clubs_output = JSON_FOLDER / "clubs.json"
    
    # Check if input files exist
    if not player_list_file.exists():
        print(f"Warning: Player List file not found: {player_list_file}")
        print(f"Expected location: {player_list_file.absolute()}")
    else:
        print(f"Processing: {player_list_file.name}")
        convert_csv_to_json(player_list_file, all_players_output)
        print(f"Created: {all_players_output.name}")
    
    if not match_results_file.exists():
        print(f"Warning: Match Results file not found: {match_results_file}")
        print(f"Expected location: {match_results_file.absolute()}")
    else:
        print(f"Processing: {match_results_file.name}")
        convert_matches(match_results_file, matches_output)
        print(f"Created: {matches_output.name}")
    
    # Extract clubs from all_players.json
    if all_players_output.exists():
        extract_clubs(all_players_output, clubs_output)
        print(f"Created: {clubs_output.name}")
    else:
        print("Warning: Cannot extract clubs - all_players.json not found")
    
    # Process historical rating files - always run this to get latest ratings
    print("\nProcessing historical rating files...")
    get_latest_historical_files()
    
    print("\nProcessing complete!")
    print(f"Output directory: {JSON_FOLDER.absolute()}")





