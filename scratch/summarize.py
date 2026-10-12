import json
import math

with open("scratch/data.json", "r") as f:
    data = json.load(f)

summary = {}
for key, values in data.items():
    if not values:
        continue
    
    count = len(values)
    
    r_vals = [v[0] for v in values]
    g_vals = [v[1] for v in values]
    b_vals = [v[2] for v in values]
    
    avg_r = sum(r_vals) / count
    avg_g = sum(g_vals) / count
    avg_b = sum(b_vals) / count
    
    min_r, max_r = min(r_vals), max(r_vals)
    min_g, max_g = min(g_vals), max(g_vals)
    min_b, max_b = min(b_vals), max(b_vals)
    
    summary[key] = {
        "rata_rata": [round(avg_r, 2), round(avg_g, 2), round(avg_b, 2)],
        "minimum": [min_r, min_g, min_b],
        "maksimum": [max_r, max_g, max_b],
    }

print(json.dumps(summary, indent=2))
