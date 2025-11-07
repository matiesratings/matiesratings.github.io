import pandas as pd
import json

# Load CSV
file = 'womens'
df = pd.read_csv(f"maties_open_25/{file}.csv")  # headers: Group, Name, Club

# Group by 'Group'
grouped = df.groupby("Group")

output = {"groups": []}

for group_number, group_df in grouped:
    group_entry = {
        "name": f"Group {group_number}",
        "players": []
    }
    for _, row in group_df.iterrows():
        group_entry["players"].append({
            "name": row["Name"].strip(),
            "club": row["Club"].strip()
        })
    output["groups"].append(group_entry)

# Save JSON
with open(f"{file}.json", "w") as f:
    json.dump(output, f, indent=2)

print("JSON saved to groups.json")
