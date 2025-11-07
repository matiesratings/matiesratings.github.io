import json

# Load JSON
with open("doubles.json", "r") as f:
    data = json.load(f)

def format_knockouts(d):
    result = "{\n  \"knockouts\": [\n"
    for stage_index, stage in enumerate(d["knockouts"]):
        result += f"    {{\n      \"stage\": \"{stage['stage']}\",\n      \"matches\": [\n"
        for match_index, match in enumerate(stage["matches"]):
            # Inline each match
            players = ",".join([json.dumps(p) for p in match])
            comma = "," if match_index < len(stage["matches"]) - 1 else ""
            result += f"        [{players}]{comma}\n"
        stage_comma = "," if stage_index < len(d["knockouts"]) - 1 else ""
        result += f"      ]\n    }}{stage_comma}\n"
    result += "  ]\n}"
    return result

formatted_json = format_knockouts(data)

# Save formatted JSON
with open("knockouts_formatted.json", "w") as f:
    f.write(formatted_json)

print("Formatted JSON saved as knockouts_formatted.json")
