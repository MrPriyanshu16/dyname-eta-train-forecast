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
        "tier": 1,
    },
    {
        "code": "GZB",
        "name": "Ghaziabad Jn",
        "km": 25.6,
        "lat": 28.6679,
        "lng": 77.4326,
        "platforms": 6,
        "is_junction": True,
        "tier": 1,
    },
    {
        "code": "ALJN",
        "name": "Aligarh Jn",
        "km": 126.0,
        "lat": 27.8974,
        "lng": 78.0880,
        "platforms": 7,
        "is_junction": True,
        "tier": 1,
    },
    {
        "code": "HRS",
        "name": "Hathras Jn",
        "km": 157.0,
        "lat": 27.6019,
        "lng": 78.0560,
        "platforms": 3,
        "is_junction": False,
        "tier": 2,
    },
    {
        "code": "TDL",
        "name": "Tundla Jn",
        "km": 204.2,
        "lat": 27.2081,
        "lng": 78.2393,
        "platforms": 5,
        "is_junction": True,
        "tier": 1,
    },
    {
        "code": "SKB",
        "name": "Shikohabad Jn",
        "km": 244.0,
        "lat": 27.1085,
        "lng": 78.5840,
        "platforms": 3,
        "is_junction": False,
        "tier": 2,
    },
    {
        "code": "ETW",
        "name": "Etawah Jn",
        "km": 297.0,
        "lat": 26.7725,
        "lng": 79.0306,
        "platforms": 5,
        "is_junction": True,
        "tier": 1,
    },
    {
        "code": "PHD",
        "name": "Phaphund",
        "km": 355.0,
        "lat": 26.5612,
        "lng": 79.4625,
        "platforms": 2,
        "is_junction": False,
        "tier": 2,
    },
    {
        "code": "RURA",
        "name": "Rura",
        "km": 396.0,
        "lat": 26.4915,
        "lng": 79.9012,
        "platforms": 2,
        "is_junction": False,
        "tier": 2,
    },
    {
        "code": "CNB",
        "name": "Kanpur Central",
        "km": 440.3,
        "lat": 26.4542,
        "lng": 80.3507,
        "platforms": 10,
        "is_junction": True,
        "tier": 1,
    }
]

SECTIONS = [
    {"id": "SEC-1", "from": "NDLS", "to": "GZB", "length_km": 25.6, "tracks": 4, "mps_kmh": 110, "capacity_trains": 6},
    {"id": "SEC-2", "from": "GZB", "to": "ALJN", "length_km": 100.4, "tracks": 3, "mps_kmh": 130, "capacity_trains": 8},
    {"id": "SEC-3", "from": "ALJN", "to": "HRS", "length_km": 31.0, "tracks": 2, "mps_kmh": 130, "capacity_trains": 4},
    {"id": "SEC-4", "from": "HRS", "to": "TDL", "length_km": 47.2, "tracks": 2, "mps_kmh": 130, "capacity_trains": 5},
    {"id": "SEC-5", "from": "TDL", "to": "SKB", "length_km": 39.8, "tracks": 2, "mps_kmh": 130, "capacity_trains": 4},
    {"id": "SEC-6", "from": "SKB", "to": "ETW", "length_km": 53.0, "tracks": 2, "mps_kmh": 130, "capacity_trains": 5},
    {"id": "SEC-7", "from": "ETW", "to": "PHD", "length_km": 58.0, "tracks": 2, "mps_kmh": 130, "capacity_trains": 4},
    {"id": "SEC-8", "from": "PHD", "to": "RURA", "length_km": 41.0, "tracks": 2, "mps_kmh": 130, "capacity_trains": 4},
    {"id": "SEC-9", "from": "RURA", "to": "CNB", "length_km": 44.3, "tracks": 3, "mps_kmh": 130, "capacity_trains": 6}
]

# Automatic Block Signals (Traffic Lights) placed along the NDLS-CNB corridor
SIGNALS = [
    {"id": "S-25", "name": "S-25", "km": 25.0, "lat": 28.6670, "lng": 77.4280, "section_id": "SEC-1", "default_aspect": "GREEN"},
    {"id": "S-48", "name": "S-48", "km": 48.0, "lat": 28.5120, "lng": 77.5850, "section_id": "SEC-2", "default_aspect": "GREEN"},
    {"id": "S-94", "name": "S-94", "km": 94.0, "lat": 28.1830, "lng": 77.8500, "section_id": "SEC-2", "default_aspect": "GREEN"},
    {"id": "S-126", "name": "S-126", "km": 126.0, "lat": 27.8970, "lng": 78.0850, "section_id": "SEC-2", "default_aspect": "GREEN"},
    {"id": "S-142", "name": "S-142", "km": 142.0, "lat": 27.7550, "lng": 78.0720, "section_id": "SEC-3", "default_aspect": "YELLOW"},
    {"id": "S-180", "name": "S-180", "km": 180.0, "lat": 27.4250, "lng": 78.1400, "section_id": "SEC-4", "default_aspect": "GREEN"},
    {"id": "S-204", "name": "S-204", "km": 204.0, "lat": 27.2080, "lng": 78.2350, "section_id": "SEC-4", "default_aspect": "RED"},
    {"id": "S-218", "name": "S-218", "km": 218.0, "lat": 27.1580, "lng": 78.3850, "section_id": "SEC-5", "default_aspect": "GREEN"},
    {"id": "S-260", "name": "S-260", "km": 260.0, "lat": 26.9800, "lng": 78.7500, "section_id": "SEC-6", "default_aspect": "GREEN"},
    {"id": "S-297", "name": "S-297", "km": 297.0, "lat": 26.7720, "lng": 79.0280, "section_id": "SEC-6", "default_aspect": "GREEN"},
    {"id": "S-304", "name": "S-304", "km": 304.0, "lat": 26.7350, "lng": 79.1100, "section_id": "SEC-7", "default_aspect": "GREEN"},
    {"id": "S-355", "name": "S-355", "km": 355.0, "lat": 26.5610, "lng": 79.4600, "section_id": "SEC-7", "default_aspect": "GREEN"},
    {"id": "S-390", "name": "S-390", "km": 390.0, "lat": 26.5050, "lng": 79.8200, "section_id": "SEC-8", "default_aspect": "GREEN"},
    {"id": "S-428", "name": "S-428", "km": 428.0, "lat": 26.4650, "lng": 80.2200, "section_id": "SEC-9", "default_aspect": "GREEN"}
]

# Nationwide Indian Railways Trunk Corridors (Golden Quadrilateral & Diagonals)
NATIONWIDE_ROUTES = [
    {
        "id": "delhi-mumbai-mainline",
        "name": "Delhi - Mumbai Central Trunk Mainline",
        "zone": "WR/NR",
        "positions": [
            [28.6429, 77.2195], [27.4924, 77.6737], [27.2152, 77.4925], [26.0024, 76.3552],
            [25.1837, 75.8369], [23.3315, 75.0367], [22.3072, 73.1812], [21.1702, 72.8311],
            [19.0760, 72.8777]
        ]
    },
    {
        "id": "delhi-howrah-mainline",
        "name": "Delhi - Howrah (Kolkata) Grand Trunk Route",
        "zone": "NCR/ECR/ER",
        "positions": [
            [28.6429, 77.2195], [28.6679, 77.4326], [27.8974, 78.0880], [27.2081, 78.2393],
            [26.7725, 79.0306], [26.4542, 80.3507], [25.4358, 81.8463], [25.2818, 83.1189],
            [24.7914, 85.0002], [23.7957, 86.4304], [23.6889, 86.9661], [22.5858, 88.3426]
        ]
    },
    {
        "id": "mumbai-chennai-mainline",
        "name": "Mumbai - Chennai Central Mainline",
        "zone": "CR/SCR/SR",
        "positions": [
            [19.0760, 72.8777], [18.5204, 73.8567], [17.6599, 75.9064], [17.0500, 76.9900],
            [16.2000, 77.3500], [15.1700, 77.3700], [14.6800, 77.6000], [13.6300, 79.4200],
            [13.0827, 80.2707]
        ]
    },
    {
        "id": "howrah-chennai-mainline",
        "name": "Howrah - Chennai East Coast Mainline",
        "zone": "SER/ECoR/SR",
        "positions": [
            [22.5858, 88.3426], [22.3300, 87.3200], [21.4900, 86.9300], [20.4600, 85.8800],
            [20.2961, 85.8245], [19.3200, 84.7900], [17.6868, 83.2185], [16.9800, 81.7800],
            [16.5062, 80.6480], [13.0827, 80.2707]
        ]
    },
    {
        "id": "delhi-chennai-grand-trunk",
        "name": "Delhi - Chennai Grand Trunk Diagonal",
        "zone": "NR/NCR/WCR/CR/SCR/SR",
        "positions": [
            [28.6429, 77.2195], [27.1767, 78.0081], [26.2183, 78.1828], [25.4484, 78.5685],
            [23.2599, 77.4126], [22.6100, 77.7600], [21.1458, 79.0882], [19.8500, 79.3500],
            [17.9689, 79.5941], [16.5062, 80.6480], [13.0827, 80.2707]
        ]
    },
    {
        "id": "mumbai-howrah-mainline",
        "name": "Mumbai - Nagpur - Howrah Mainline",
        "zone": "CR/SECR/SER",
        "positions": [
            [19.0760, 72.8777], [19.9975, 73.7898], [20.9300, 75.5600], [20.7000, 77.0000],
            [21.1458, 79.0882], [21.2514, 81.6296], [22.0797, 82.1409], [22.2200, 84.8500],
            [22.8000, 86.2000], [22.3300, 87.3200], [22.5858, 88.3426]
        ]
    },
    {
        "id": "konkan-railway-route",
        "name": "Konkan Railway Scenic Coastal Route",
        "zone": "KRCL",
        "positions": [
            [18.9000, 73.1000], [18.2300, 73.1800], [16.9900, 73.3000], [15.2832, 73.9862],
            [14.8100, 74.1300], [13.3400, 74.7400], [12.8700, 74.8800]
        ]
    },
    {
        "id": "bengaluru-hyderabad-link",
        "name": "Bengaluru - Secunderabad - Nagpur Route",
        "zone": "SWR/SCR",
        "positions": [
            [12.9716, 77.5946], [14.6800, 77.6000], [15.1700, 77.3700], [17.3850, 78.4867],
            [18.0000, 79.6000], [19.8500, 79.3500], [21.1458, 79.0882]
        ]
    },
    {
        "id": "delhi-jammu-link",
        "name": "Delhi - Ambala - Amritsar - Jammu Tawi",
        "zone": "NR",
        "positions": [
            [28.6429, 77.2195], [29.6857, 76.9905], [30.3752, 76.7821], [30.9010, 75.8573],
            [31.6340, 74.8723], [32.7266, 74.8570]
        ]
    },
    {
        "id": "northeast-frontier-link",
        "name": "Katihar - Siliguri - Guwahati Northeast Link",
        "zone": "NFR",
        "positions": [
            [25.5500, 87.5700], [26.7271, 88.3953], [26.3200, 89.4600], [26.5000, 90.5400],
            [26.1445, 91.7362]
        ]
    }
]

# Major Nationwide Railway Hubs (All-India Stations)
NATIONWIDE_STATIONS = [
    {"code": "NDLS", "name": "New Delhi", "lat": 28.6429, "lng": 77.2195, "zone": "NR"},
    {"code": "CSMT", "name": "Mumbai CSMT", "lat": 18.9400, "lng": 72.8353, "zone": "CR"},
    {"code": "HWH", "name": "Howrah Jn", "lat": 22.5858, "lng": 88.3426, "zone": "ER"},
    {"code": "MAS", "name": "Chennai Central", "lat": 13.0827, "lng": 80.2707, "zone": "SR"},
    {"code": "SBC", "name": "KSR Bengaluru", "lat": 12.9716, "lng": 77.5946, "zone": "SWR"},
    {"code": "SC", "name": "Secunderabad", "lat": 17.4399, "lng": 78.5017, "zone": "SCR"},
    {"code": "ADI", "name": "Ahmedabad Jn", "lat": 23.0225, "lng": 72.5714, "zone": "WR"},
    {"code": "JP", "name": "Jaipur Jn", "lat": 26.9124, "lng": 75.7873, "zone": "NWR"},
    {"code": "BPL", "name": "Bhopal Jn", "lat": 23.2599, "lng": 77.4126, "zone": "WCR"},
    {"code": "NGP", "name": "Nagpur Jn", "lat": 21.1458, "lng": 79.0882, "zone": "CR"},
    {"code": "PRYJ", "name": "Prayagraj Jn", "lat": 25.4358, "lng": 81.8463, "zone": "NCR"},
    {"code": "PNBE", "name": "Patna Jn", "lat": 25.6000, "lng": 85.1300, "zone": "ECR"},
    {"code": "GHY", "name": "Guwahati", "lat": 26.1445, "lng": 91.7362, "zone": "NFR"},
    {"code": "BBS", "name": "Bhubaneswar", "lat": 20.2961, "lng": 85.8245, "zone": "ECoR"},
    {"code": "LKO", "name": "Lucknow Charbagh", "lat": 26.8320, "lng": 80.9200, "zone": "NR"},
    {"code": "JAT", "name": "Jammu Tawi", "lat": 32.7266, "lng": 74.8570, "zone": "NR"},
    {"code": "MAO", "name": "Madgaon Jn", "lat": 15.2832, "lng": 73.9862, "zone": "KR"},
    {"code": "ERS", "name": "Ernakulam Jn", "lat": 9.9690, "lng": 76.2900, "zone": "SR"}
]

TRAINS_SCHEDULE = [
    {
        "train_number": "22436",
        "train_name": "Vande Bharat Express",
        "category": "Vande Bharat",
        "priority_tier": 1,
        "color": "#0284C7",
        "loco": "Train-18 EMU",
        "heading": "118° SE",
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
        "color": "#E11D48",
        "loco": "WAP-7 (HOG)",
        "heading": "118° SE",
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
        "color": "#D97706",
        "loco": "WAP-7",
        "heading": "118° SE",
        "stops": [
            {"station": "NDLS", "arr": "06:10", "dep": "06:10", "km": 0.0, "platform": 3},
            {"station": "GZB", "arr": "06:48", "dep": "06:50", "km": 25.6, "platform": 2},
            {"station": "ALJN", "arr": "07:47", "dep": "07:49", "km": 126.0, "platform": 3},
            {"station": "TDL", "arr": "08:43", "dep": "08:45", "km": 204.2, "platform": 3},
            {"station": "ETW", "arr": "09:40", "dep": "09:42", "km": 297.0, "platform": 1},
            {"station": "CNB", "arr": "11:20", "dep": "11:25", "km": 440.3, "platform": 2}
        ]
    },
    {
        "train_number": "12556",
        "train_name": "Gorakhdham Superfast",
        "category": "Superfast",
        "priority_tier": 3,
        "color": "#059669",
        "loco": "WAP-7",
        "heading": "118° SE",
        "stops": [
            {"station": "NDLS", "arr": "21:25", "dep": "21:25", "km": 0.0, "platform": 6},
            {"station": "GZB", "arr": "22:03", "dep": "22:05", "km": 25.6, "platform": 1},
            {"station": "ALJN", "arr": "23:18", "dep": "23:20", "km": 126.0, "platform": 2},
            {"station": "TDL", "arr": "00:40", "dep": "00:42", "km": 204.2, "platform": 4},
            {"station": "ETW", "arr": "01:45", "dep": "01:47", "km": 297.0, "platform": 2},
            {"station": "CNB", "arr": "03:15", "dep": "03:20", "km": 440.3, "platform": 3}
        ]
    },
    {
        "train_number": "14056",
        "train_name": "Brahmaputra Mail",
        "category": "Mail/Express",
        "priority_tier": 4,
        "color": "#7C3AED",
        "loco": "WAP-4",
        "heading": "118° SE",
        "stops": [
            {"station": "NDLS", "arr": "23:40", "dep": "23:40", "km": 0.0, "platform": 14},
            {"station": "GZB", "arr": "00:26", "dep": "00:28", "km": 25.6, "platform": 2},
            {"station": "ALJN", "arr": "01:50", "dep": "01:55", "km": 126.0, "platform": 2},
            {"station": "TDL", "arr": "03:30", "dep": "03:35", "km": 204.2, "platform": 3},
            {"station": "ETW", "arr": "04:55", "dep": "05:00", "km": 297.0, "platform": 3},
            {"station": "CNB", "arr": "07:15", "dep": "07:25", "km": 440.3, "platform": 4}
        ]
    }
]
