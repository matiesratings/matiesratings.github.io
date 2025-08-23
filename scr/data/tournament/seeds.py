import pandas as pd
import json

# Load CSV
df = pd.read_csv("doubles.csv")  # headers: Seed, P1, P2
df = df.sort_values("Seed")      # ensure sorted by seed

# Number of pairs
n = len(df)

# Standard seeding order (ensures correct pairings: 1v32, 2v31, etc.)
def seed_order(n):
    order = [1, 2]
    while len(order) < n:
        temp = []
        for o in order:
            temp.append(o)
            temp.append(len(order)*2 + 1 - o)
        order = temp
    return [x-1 for x in order]  # zero-based index

# Custom display order for matches: TL, TR, BL, BR, ML, MR, ...
def display_order(num_matches):
    order = []
    # step = pairs of matches (left/right)
    for i in range(0, num_matches, 2):
        order.append(i)     # Left
        if i+1 < num_matches:
            order.append(i+1)  # Right
    return order

# Create matches with 4 players each
order = seed_order(n)
matches = []
for i in range(0, n, 2):
    p1 = df.iloc[order[i]]
    p2 = df.iloc[order[i+1]]
    match = [
        {"name": p1["P1"]},
        {"name": p1["P2"]},
        {"name": p2["P1"]},
        {"name": p2["P2"]}
    ]
    matches.append(match)

# Reorder matches for display
matches_display = [matches[i] for i in display_order(len(matches))]

# Wrap in JSON
output = {
    "stage": f"Round {n*2}",
    "matches": matches_display
}

with open("doubles.json", "w") as f:
    json.dump(output, f, indent=2)

print("JSON saved to doubles.json")
