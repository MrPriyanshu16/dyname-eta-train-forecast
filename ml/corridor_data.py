"""
Corridor Data: New Delhi (NDLS) to Kanpur Central (CNB) Trunk Corridor (~440 km)
Part of North Central Railway (NCR) / Northern Railway (NR) - Golden Quadrilateral
"""

STATIONS = [
    {
        "code": "NDLS",
        "name": "New Delhi",
        "km": 0.0,
        "lat": 28.6429,
        "lng": 77.2195,
        "platforms": 16,
        "is_junction": True,
    },
    {
        "code": "GZB",
        "name": "Ghaziabad Jn",
        "km": 25.6,
        "lat": 28.6679,
        "lng": 77.4326,
        "platforms": 6,
        "is_junction": True,
    },
    {
        "code": "ALJN",
        "name": "Aligarh Jn",
        "km": 131.0,
        "lat": 27.8974,
        "lng": 78.0880,
        "platforms": 7,
        "is_junction": True,
    },
    {
        "code": "HRS",
        "name": "Hathras Jn",
        "km": 161.4,
        "lat": 27.6019,
        "lng": 78.0560,
        "platforms": 3,
        "is_junction": False,
    },
    {
        "code": "TDL",
        "name": "Tundla Jn",
        "km": 209.1,
        "lat": 27.2081,
        "lng": 78.2393,
        "platforms": 5,
        "is_junction": True,
    },
    {
        "code": "ETW",
        "name": "Etawah Jn",
        "km": 300.7,
        "lat": 26.7725,
        "lng": 79.0306,
        "platforms": 5,
        "is_junction": True,
    },
    {
        "code": "CNB",
        "name": "Kanpur Central",
        "km": 440.3,
        "lat": 26.4542,
        "lng": 80.3507,
        "platforms": 10,
        "is_junction": True,
    }
]

SECTIONS = [
    {
        "id": "SEC-1",
        "from": "NDLS",
        "to": "GZB",
        "length_km": 25.6,
        "tracks": 4,
        "mps_kmh": 110,
        "capacity_trains": 6
    },
    {
        "id": "SEC-2",
        "from": "GZB",
        "to": "ALJN",
        "length_km": 105.4,
        "tracks": 3,
        "mps_kmh": 130,
        "capacity_trains": 8
    },
    {
        "id": "SEC-3",
        "from": "ALJN",
        "to": "HRS",
        "length_km": 30.4,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 4
    },
    {
        "id": "SEC-4",
        "from": "HRS",
        "to": "TDL",
        "length_km": 47.7,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 5
    },
    {
        "id": "SEC-5",
        "from": "TDL",
        "to": "ETW",
        "length_km": 91.6,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 7
    },
    {
        "id": "SEC-6",
        "from": "ETW",
        "to": "CNB",
        "length_km": 139.6,
        "tracks": 3,
        "mps_kmh": 130,
        "capacity_trains": 9
    }
]

# Priority Tiers:
# 1: Super Priority (Vande Bharat, Rajdhani)
# 2: High Priority (Shatabdi)
# 3: Standard Superfast Express
# 4: Regular Mail/Express
TRAINS_SCHEDULE = [
    {
        "train_number": "22436",
        "train_name": "Vande Bharat Express",
        "category": "Vande Bharat",
        "priority_tier": 1,
        "color": "#0284C7",  # Sky Blue
        "stops": [
            {"station": "NDLS", "arr": "06:00", "dep": "06:00", "km": 0.0, "platform": 1},
            {"station": "CNB", "arr": "10:08", "dep": "10:10", "km": 440.3, "platform": 1}
        ]
    },
    {
        "train_number": "12423",
        "train_name": "Dibrugarh Rajdhani Express",
        "category": "Rajdhani",
        "priority_tier": 1,
        "color": "#E11D48",  # Rose Red
        "stops": [
            {"station": "NDLS", "arr": "16:20", "dep": "16:20", "km": 0.0, "platform": 2},
            {"station": "CNB", "arr": "21:02", "dep": "21:07", "km": 440.3, "platform": 1}
        ]
    },
    {
        "train_number": "12004",
        "train_name": "Lucknow Shatabdi Express",
        "category": "Shatabdi",
        "priority_tier": 2,
        "color": "#D97706",  # Amber
        "stops": [
            {"station": "NDLS", "arr": "06:10", "dep": "06:10", "km": 0.0, "platform": 3},
            {"station": "GZB", "arr": "06:48", "dep": "06:50", "km": 25.6, "platform": 2},
            {"station": "ALJN", "arr": "07:47", "dep": "07:49", "km": 131.0, "platform": 3},
            {"station": "TDL", "arr": "08:43", "dep": "08:45", "km": 209.1, "platform": 3},
            {"station": "ETW", "arr": "09:40", "dep": "09:42", "km": 300.7, "platform": 1},
            {"station": "CNB", "arr": "11:20", "dep": "11:25", "km": 440.3, "platform": 2}
        ]
    },
    {
        "train_number": "12556",
        "train_name": "Gorakhdham Superfast",
        "category": "Superfast",
        "priority_tier": 3,
        "color": "#059669",  # Emerald
        "stops": [
            {"station": "NDLS", "arr": "21:25", "dep": "21:25", "km": 0.0, "platform": 6},
            {"station": "GZB", "arr": "22:03", "dep": "22:05", "km": 25.6, "platform": 1},
            {"station": "ALJN", "arr": "23:18", "dep": "23:20", "km": 131.0, "platform": 2},
            {"station": "TDL", "arr": "00:40", "dep": "00:42", "km": 209.1, "platform": 4},
            {"station": "ETW", "arr": "01:45", "dep": "01:47", "km": 300.7, "platform": 2},
            {"station": "CNB", "arr": "03:15", "dep": "03:20", "km": 440.3, "platform": 3}
        ]
    },
    {
        "train_number": "14056",
        "train_name": "Brahmaputra Mail",
        "category": "Mail/Express",
        "priority_tier": 4,
        "color": "#7C3AED",  # Violet
        "stops": [
            {"station": "NDLS", "arr": "23:40", "dep": "23:40", "km": 0.0, "platform": 14},
            {"station": "GZB", "arr": "00:26", "dep": "00:28", "km": 25.6, "platform": 2},
            {"station": "ALJN", "arr": "01:50", "dep": "01:55", "km": 131.0, "platform": 2},
            {"station": "TDL", "arr": "03:30", "dep": "03:35", "km": 209.1, "platform": 3},
            {"station": "ETW", "arr": "04:55", "dep": "05:00", "km": 300.7, "platform": 3},
            {"station": "CNB", "arr": "07:15", "dep": "07:25", "km": 440.3, "platform": 4}
        ]
    }
]
