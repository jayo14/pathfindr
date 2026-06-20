import math
import heapq
from typing import Dict, List, Optional, Tuple

CAMPUS_NODES = {
    "ict-center": (6.4672, 3.5951),
    "engineering-block": (6.4684, 3.5968),
    "library-complex": (6.4661, 3.5979),
    "admin-tower": (6.4655, 3.5946),
    "science-labs": (6.4676, 3.5988),
    "student-hub": (6.4648, 3.5961),
    "wp-central-north": (6.4676, 3.5963),
    "wp-central-south": (6.4657, 3.5963),
    "wp-central-mid": (6.4666, 3.5963),
    "wp-east-north": (6.4676, 3.5978),
    "wp-east-south": (6.4657, 3.5978),
    "wp-main-gate": (6.4644, 3.5963),
    "wp-north-path": (6.4681, 3.5963),
    "wp-lab-connector": (6.4676, 3.5984),
}

def haversine_meters(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

def build_graph(max_edge_meters=600) -> Dict:
    graph = {nid: [] for nid in CAMPUS_NODES}
    nodes = list(CAMPUS_NODES.items())
    for i in range(len(nodes)):
        for j in range(i+1, len(nodes)):
            id1, (lat1, lon1) = nodes[i]
            id2, (lat2, lon2) = nodes[j]
            d = haversine_meters(lat1, lon1, lat2, lon2)
            if d <= max_edge_meters:
                graph[id1].append((id2, d))
                graph[id2].append((id1, d))
    return graph

GRAPH = build_graph()

def nearest_node(lat, lon) -> str:
    return min(CAMPUS_NODES.keys(), key=lambda nid: haversine_meters(lat, lon, *CAMPUS_NODES[nid]))

def astar(start_id, end_id) -> Optional[Tuple[List[str], float]]:
    def heuristic(node_id):
        return haversine_meters(*CAMPUS_NODES[node_id], *CAMPUS_NODES[end_id])

    g_score = {nid: float('inf') for nid in CAMPUS_NODES}
    g_score[start_id] = 0
    f_score = {nid: float('inf') for nid in CAMPUS_NODES}
    f_score[start_id] = heuristic(start_id)

    prev = {nid: None for nid in CAMPUS_NODES}
    pq = [(f_score[start_id], start_id)]

    while pq:
        _, current = heapq.heappop(pq)

        if current == end_id:
            path = []
            while current:
                path.insert(0, current)
                current = prev[current]
            return path, g_score[end_id]

        for neighbor, weight in GRAPH.get(current, []):
            tentative_g_score = g_score[current] + weight
            if tentative_g_score < g_score[neighbor]:
                prev[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = tentative_g_score + heuristic(neighbor)
                heapq.heappush(pq, (f_score[neighbor], neighbor))

    return None

def calculate_bearing(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    d_lon = lon2 - lon1
    y = math.sin(d_lon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(d_lon)
    bearing = (math.degrees(math.atan2(y, x)) + 360) % 360
    return bearing

def get_direction_label(bearing):
    if 337.5 <= bearing or bearing < 22.5: return "North"
    if 22.5 <= bearing < 67.5: return "North-East"
    if 67.5 <= bearing < 112.5: return "East"
    if 112.5 <= bearing < 157.5: return "South-East"
    if 157.5 <= bearing < 202.5: return "South"
    if 202.5 <= bearing < 247.5: return "South-West"
    if 247.5 <= bearing < 292.5: return "West"
    if 292.5 <= bearing < 337.5: return "North-West"
    return ""

def generate_instructions(path: List[str]) -> List[dict]:
    instructions = []
    if len(path) < 2:
        return instructions

    for i in range(len(path) - 1):
        curr_id = path[i]
        next_id = path[i+1]
        curr_coord = CAMPUS_NODES[curr_id]
        next_coord = CAMPUS_NODES[next_id]

        dist = haversine_meters(*curr_coord, *next_coord)
        bearing = calculate_bearing(*curr_coord, *next_coord)
        direction = get_direction_label(bearing)

        target_name = next_id.replace("wp-", "waypoint ").replace("-", " ").title()

        if i == 0:
            start_name = curr_id.replace("wp-", "waypoint ").replace("-", " ").title()
            text = f"Start at {start_name} and head {direction} towards {target_name}."
        else:
            text = f"Continue {direction} for {round(dist)}m towards {target_name}."

        instructions.append({
            "instruction": text,
            "distanceMeters": round(dist),
            "coordinate": {"latitude": next_coord[0], "longitude": next_coord[1]}
        })

    instructions.append({
        "instruction": "You have arrived at your destination.",
        "distanceMeters": 0,
        "coordinate": {"latitude": CAMPUS_NODES[path[-1]][0], "longitude": CAMPUS_NODES[path[-1]][1]}
    })

    return instructions

def compute_route(orig_lat, orig_lon, dest_lat, dest_lon) -> dict:
    start = nearest_node(orig_lat, orig_lon)
    end = nearest_node(dest_lat, dest_lon)

    result = astar(start, end)
    if not result:
        return {"error": "No route found"}

    path, total_dist = result

    points = [{"latitude": orig_lat, "longitude": orig_lon}]
    for nid in path:
        lat, lon = CAMPUS_NODES[nid]
        points.append({"latitude": lat, "longitude": lon})
    points.append({"latitude": dest_lat, "longitude": dest_lon})

    instructions = generate_instructions(path)

    return {
        "points": points,
        "distanceMeters": round(total_dist),
        "durationMinutes": max(1, round(total_dist / 80)),
        "instructions": instructions
    }
