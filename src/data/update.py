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

# CSV file prefixes to auto-detect
CSV_FILE_PREFIXES = ["Player List", "Match Results"]

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

def convert_clutch(input_path, output_path):
    with open(input_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        data = []
        for row in reader:
            data.append({
                "maties_id": int(row["ID"]),
                "name": row["Name"],
                "matches": int(row["Matches"]),
                "deciders": int(row["Deciders"]),
                "clutch_wins": int(row["Clutch Wins"]),
                "clutch_rate": float(row["Clutch Rate"]),
                "decider_pct": float(row["Decider %"])
            })
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def generate_club_stats(json_folder, output_path):
    """Generate aggregated club statistics from all rating and player data."""

    def load_json(filename):
        path = json_folder / filename
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return []

    all_players = load_json("all_players.json")
    men = load_json("men_ratings.json")
    women = load_json("women_ratings.json")
    open_r = load_json("open_ratings.json")
    clutch = load_json("clutch_ratings.json")
    matches = load_json("matches.json")

    # All rating categories for top-10 counting
    categories = [
        ("open", "open_ratings.json"),
        ("men", "men_ratings.json"),
        ("women", "women_ratings.json"),
        ("mo40", "mo40_ratings.json"),
        ("mo50", "mo50_ratings.json"),
        ("mo60", "mo60_ratings.json"),
        ("bu19", "bu19_ratings.json"),
        ("gu19", "gu19_ratings.json"),
        ("bu15", "bu15_ratings.json"),
        ("gu15", "gu15_ratings.json"),
        ("bu13", "bu13_ratings.json"),
        ("gu13", "gu13_ratings.json"),
        ("bu11", "bu11_ratings.json"),
        ("gu11", "gu11_ratings.json"),
    ]
    junior_ids = set(["bu19", "bu15", "bu13", "bu11", "gu19", "gu15", "gu13", "gu11"])

    # Load all categories
    cat_data = {}
    for cat_id, filename in categories:
        cat_data[cat_id] = load_json(filename)

    # Build player-to-club map from all_players
    player_club = {}
    for p in all_players:
        player_club[p["name"]] = p.get("club", "unknown_club")

    # Group players by club
    clubs = {}
    for p in all_players:
        club = p.get("club", "unknown_club")
        if club not in clubs:
            clubs[club] = {"men": [], "women": [], "juniors": set()}
        if p.get("gender") == "Male":
            clubs[club]["men"].append(p["name"])
        elif p.get("gender") == "Female":
            clubs[club]["women"].append(p["name"])

    # Find juniors (anyone in junior categories)
    for cat_id in junior_ids:
        for p in cat_data.get(cat_id, []):
            club = p.get("club", player_club.get(p.get("name", ""), "unknown_club"))
            if club in clubs:
                clubs[club]["juniors"].add(p.get("name", ""))

    # Index ratings by name for quick lookup
    men_by_name = {p["name"]: p for p in men}
    women_by_name = {p["name"]: p for p in women}
    open_by_name = {p["name"]: p for p in open_r}
    clutch_by_name = {p["name"]: p for p in clutch}

    # Match stats: count wins/losses per player
    player_wins = {}
    player_losses = {}
    for m in matches:
        player_wins[m["winner"]] = player_wins.get(m["winner"], 0) + 1
        player_losses[m["loser"]] = player_losses.get(m["loser"], 0) + 1

    # Top 10 per category by club
    top10_by_club = {}
    for cat_id, _ in categories:
        data = cat_data.get(cat_id, [])
        top10 = data[:10]  # already sorted by rank
        for p in top10:
            club = p.get("club", player_club.get(p.get("name", ""), "unknown_club"))
            if club not in top10_by_club:
                top10_by_club[club] = {}
            key = f"top10_{cat_id}"
            top10_by_club[club][key] = top10_by_club[club].get(key, 0) + 1

    results = []
    for club, members in clubs.items():
        all_names = members["men"] + members["women"]
        total = len(all_names)
        if total == 0 or club == "unknown_club":
            continue

        n_men = len(members["men"])
        n_women = len(members["women"])
        n_juniors = len(members["juniors"])

        # Average ratings
        men_ratings = [men_by_name[n]["rating"] for n in members["men"] if n in men_by_name and men_by_name[n].get("rating")]
        women_ratings = [women_by_name[n]["rating"] for n in members["women"] if n in women_by_name and women_by_name[n].get("rating")]
        open_ratings_list = [open_by_name[n]["rating"] for n in all_names if n in open_by_name and open_by_name[n].get("rating")]

        avg_men = round(sum(men_ratings) / len(men_ratings)) if men_ratings else None
        avg_women = round(sum(women_ratings) / len(women_ratings)) if women_ratings else None
        avg_open = round(sum(open_ratings_list) / len(open_ratings_list)) if open_ratings_list else None

        # Highest rated
        best_man = max((men_by_name[n] for n in members["men"] if n in men_by_name and men_by_name[n].get("rating")), key=lambda x: x["rating"], default=None)
        best_woman = max((women_by_name[n] for n in members["women"] if n in women_by_name and women_by_name[n].get("rating")), key=lambda x: x["rating"], default=None)

        # Top 100 (men + women only, not juniors)
        top100_men = sum(1 for n in members["men"] if n in men_by_name and men_by_name[n].get("rank", 999) <= 100)
        top100_women = sum(1 for n in members["women"] if n in women_by_name and women_by_name[n].get("rank", 999) <= 100)

        # Top 10 stats
        club_top10 = top10_by_club.get(club, {})
        top10_total = sum(club_top10.values())

        # Match stats
        total_wins = sum(player_wins.get(n, 0) for n in all_names)
        total_losses_count = sum(player_losses.get(n, 0) for n in all_names)
        total_matches_count = total_wins + total_losses_count
        win_pct = round(total_wins / total_matches_count * 100, 1) if total_matches_count > 0 else None

        # Clutch
        clutch_players = [clutch_by_name[n] for n in all_names if n in clutch_by_name and clutch_by_name[n].get("deciders", 0) > 0]
        avg_clutch = round(sum(c["clutch_rate"] for c in clutch_players) / len(clutch_players), 1) if clutch_players else None
        best_clutch = max(clutch_players, key=lambda x: x["clutch_rate"], default=None) if clutch_players else None

        entry = {
            "club": club,
            "total_players": total,
            "men_players": n_men,
            "women_players": n_women,
            "junior_players": n_juniors,
            "pct_men": round(n_men / total * 100, 1),
            "pct_women": round(n_women / total * 100, 1),
            "pct_juniors": round(n_juniors / total * 100, 1) if total > 0 else 0,
            "avg_men_rating": avg_men,
            "avg_women_rating": avg_women,
            "avg_open_rating": avg_open,
            "highest_rated_player": {"name": best_man["name"], "rating": best_man["rating"], "category": "Men's"} if best_man else None,
            "highest_rated_woman": {"name": best_woman["name"], "rating": best_woman["rating"]} if best_woman else None,
            "top100_men": top100_men,
            "top100_women": top100_women,
        }

        # Add per-category top10 counts
        for cat_id, _ in categories:
            entry[f"top10_{cat_id}"] = club_top10.get(f"top10_{cat_id}", 0)
        entry["top10_total"] = top10_total

        entry["total_matches"] = total_matches_count
        entry["total_wins"] = total_wins
        entry["total_losses"] = total_losses_count
        entry["overall_win_pct"] = win_pct
        entry["avg_clutch_rate"] = avg_clutch
        entry["top_clutch_player"] = {"name": best_clutch["name"], "clutch_rate": best_clutch["clutch_rate"]} if best_clutch else None

        results.append(entry)

    # Sort by avg_men_rating descending (None last)
    results.sort(key=lambda x: x.get("avg_men_rating") or 0, reverse=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"Generated club stats for {len(results)} clubs")


def extract_clubs(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        players = json.load(f)

    clubs = sorted({player["club"] for player in players})

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"clubs": clubs}, f, indent=2)


def get_latest_csv(prefix, folder=None):
    """
    Finds the latest CSV file matching a given prefix by date.
    E.g. prefix="Player List" matches "Player List (2026-02-17).csv"

    Returns the path to the latest file, or None if not found.
    """
    if folder is None:
        folder = CSV_FOLDER

    latest_date = None
    latest_path = None

    for path in folder.glob(f"{prefix} (*.csv"):
        match = re.match(rf"{re.escape(prefix)} \((\d{{4}}-\d{{2}}-\d{{2}})\)\.csv", path.name)
        if not match:
            continue
        try:
            date = datetime.strptime(match.group(1), "%Y-%m-%d")
            if latest_date is None or date > latest_date:
                latest_date = date
                latest_path = path
        except ValueError:
            continue

    return latest_path


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
    # Ensure directories exist
    CSV_FOLDER.mkdir(parents=True, exist_ok=True)
    JSON_FOLDER.mkdir(parents=True, exist_ok=True)

    all_players_output = JSON_FOLDER / "all_players.json"
    matches_output = JSON_FOLDER / "matches.json"
    clubs_output = JSON_FOLDER / "clubs.json"

    # Auto-detect latest CSV files and extract the date
    player_list_file = get_latest_csv("Player List")
    match_results_file = get_latest_csv("Match Results")

    # Determine the data date from whichever CSV was found
    data_date = None
    for f in [player_list_file, match_results_file]:
        if f:
            m = re.search(r"\((\d{4}-\d{2}-\d{2})\)", f.name)
            if m:
                data_date = m.group(1)
                break

    if data_date:
        print(f"DATA_DATE={data_date}")

    if not player_list_file:
        print("Warning: No Player List CSV found in csv/")
    else:
        print(f"Processing: {player_list_file.name}")
        convert_csv_to_json(player_list_file, all_players_output)
        print(f"Created: {all_players_output.name}")

    if not match_results_file:
        print("Warning: No Match Results CSV found in csv/")
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

    # Process clutch rate CSV
    clutch_file = get_latest_csv("Clutch Rate")
    clutch_output = JSON_FOLDER / "clutch_ratings.json"
    if not clutch_file:
        print("Warning: No Clutch Rate CSV found in csv/")
    else:
        print(f"Processing: {clutch_file.name}")
        convert_clutch(clutch_file, clutch_output)
        print(f"Created: {clutch_output.name}")

    # Process historical rating files - always run this to get latest ratings
    print("\nProcessing historical rating files...")
    get_latest_historical_files()

    # Generate club stats
    print("\nGenerating club stats...")
    club_stats_output = JSON_FOLDER / "club_stats.json"
    generate_club_stats(JSON_FOLDER, club_stats_output)

    print("\nProcessing complete!")
    print(f"Output directory: {JSON_FOLDER.absolute()}")





