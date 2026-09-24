"""
Corridor Data: Rajasthan State Railway Network (North Western Railway - NWR)
Prime Lifeline Corridor: Jaipur Junction (JP) to Jodhpur Junction (JU) via Ajmer Junction (AII) (~412 km)
Connecting Capital City (Jaipur), Holy & Heritage Hub (Ajmer), and Sun City (Jodhpur).
"""

STATIONS = [
    {
        "code": "JP",
        "name": "Jaipur Junction",
        "km": 0.0,
        "lat": 26.9196,
        "lng": 75.7878,
        "platforms": 8,
        "is_junction": True,
        "division": "Jaipur Division (NWR HQ)"
    },
    {
        "code": "FL",
        "name": "Phulera Junction",
        "km": 54.6,
        "lat": 26.8732,
        "lng": 75.2415,
        "platforms": 5,
        "is_junction": True,
        "division": "Jaipur Division"
    },
    {
        "code": "KSG",
        "name": "Kishangarh",
        "km": 105.8,
        "lat": 26.5772,
        "lng": 74.8640,
        "platforms": 3,
        "is_junction": False,
        "division": "Ajmer Division"
    },
    {
        "code": "AII",
        "name": "Ajmer Junction",
        "km": 135.0,
        "lat": 26.4525,
        "lng": 74.6399,
        "platforms": 6,
        "is_junction": True,
        "division": "Ajmer Division"
    },
    {
        "code": "BER",
        "name": "Beawar",
        "km": 187.0,
        "lat": 26.1030,
        "lng": 74.3210,
        "platforms": 3,
        "is_junction": False,
        "division": "Ajmer Division"
    },
    {
        "code": "MJ",
        "name": "Marwar Junction",
        "km": 275.0,
        "lat": 25.7317,
        "lng": 73.6122,
        "platforms": 5,
        "is_junction": True,
        "division": "Jodhpur / Ajmer Division"
    },
    {
        "code": "PMY",
        "name": "Pali Marwar",
        "km": 342.0,
        "lat": 25.7711,
        "lng": 73.3234,
        "platforms": 3,
        "is_junction": False,
        "division": "Jodhpur Division"
    },
    {
        "code": "JU",
        "name": "Jodhpur Junction",
        "km": 412.0,
        "lat": 26.2842,
        "lng": 73.0188,
        "platforms": 6,
        "is_junction": True,
        "division": "Jodhpur Division"
    }
]

SECTIONS = [
    {
        "id": "SEC-1",
        "from": "JP",
        "to": "FL",
        "length_km": 54.6,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 6
    },
    {
        "id": "SEC-2",
        "from": "FL",
        "to": "KSG",
        "length_km": 51.2,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 6
    },
    {
        "id": "SEC-3",
        "from": "KSG",
        "to": "AII",
        "length_km": 29.2,
        "tracks": 2,
        "mps_kmh": 110,
        "capacity_trains": 4
    },
    {
        "id": "SEC-4",
        "from": "AII",
        "to": "BER",
        "length_km": 52.0,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 5
    },
    {
        "id": "SEC-5",
        "from": "BER",
        "to": "MJ",
        "length_km": 88.0,
        "tracks": 2,
        "mps_kmh": 130,
        "capacity_trains": 7
    },
    {
        "id": "SEC-6",
        "from": "MJ",
        "to": "PMY",
        "length_km": 67.0,
        "tracks": 2,
        "mps_kmh": 110,
        "capacity_trains": 5
    },
    {
        "id": "SEC-7",
        "from": "PMY",
        "to": "JU",
        "length_km": 70.0,
        "tracks": 2,
        "mps_kmh": 110,
        "capacity_trains": 6
    }
]

# Automatic Block Signals along Rajasthan Corridor
SIGNALS = [
    {"id": "SIG-JP-1", "name": "Jaipur Outbound Auto Signal", "km": 15.0, "section_id": "SEC-1", "lat": 26.905, "lng": 75.640},
    {"id": "SIG-FL-1", "name": "Phulera Approach Auto Signal", "km": 48.0, "section_id": "SEC-1", "lat": 26.879, "lng": 75.295},
    {"id": "SIG-KSG-1", "name": "Kishangarh Outer Signal", "km": 98.0, "section_id": "SEC-2", "lat": 26.610, "lng": 74.915},
    {"id": "SIG-AII-1", "name": "Ajmer Outer Distant Signal", "km": 128.0, "section_id": "SEC-3", "lat": 26.475, "lng": 74.690},
    {"id": "SIG-BER-1", "name": "Beawar Auto Signal", "km": 175.0, "section_id": "SEC-4", "lat": 26.150, "lng": 74.375},
    {"id": "SIG-MJ-1", "name": "Marwar Junction Home Signal", "km": 265.0, "section_id": "SEC-5", "lat": 25.790, "lng": 73.680},
    {"id": "SIG-PMY-1", "name": "Pali Marwar Block Signal", "km": 330.0, "section_id": "SEC-6", "lat": 25.760, "lng": 73.380},
    {"id": "SIG-JU-1", "name": "Jodhpur City Advance Starter", "km": 405.0, "section_id": "SEC-7", "lat": 26.260, "lng": 73.045}
]

# Major Connecting Routes Across Rajasthan & India
NATIONWIDE_ROUTES = [
    {
        "id": "jaipur-delhi-link",
        "name": "Jaipur - Alwar - Rewari - Delhi",
        "zone": "NWR",
        "positions": [
            [26.9196, 75.7878], [27.5530, 76.6346], [28.1920, 76.6180], [28.6429, 77.2195]
        ]
    },
    {
        "id": "jaipur-kota-link",
        "name": "Jaipur - Sawai Madhopur - Kota",
        "zone": "WCR",
        "positions": [
            [26.9196, 75.7878], [25.9961, 76.3688], [25.2138, 75.8648]
        ]
    },
    {
        "id": "ajmer-udaipur-link",
        "name": "Ajmer - Bhilwara - Chanderiya - Udaipur City",
        "zone": "NWR",
        "positions": [
            [26.4525, 74.6399], [25.3400, 74.6300], [24.8300, 74.6200], [24.5800, 73.7000]
        ]
    },
    {
        "id": "jaipur-bikaner-link",
        "name": "Jaipur - Sikar - Churu - Bikaner",
        "zone": "NWR",
        "positions": [
            [26.9196, 75.7878], [27.6100, 75.1400], [28.3000, 74.9600], [28.0181, 73.3174]
        ]
    },
    {
        "id": "jodhpur-bikaner-link",
        "name": "Jodhpur - Merta Road - Nagaur - Bikaner",
        "zone": "NWR",
        "positions": [
            [26.2842, 73.0188], [26.6500, 74.0300], [27.2000, 73.7400], [28.0181, 73.3174]
        ]
    },
    {
        "id": "jodhpur-ahmedabad-link",
        "name": "Jodhpur - Marwar - Abu Road - Ahmedabad",
        "zone": "WR/NWR",
        "positions": [
            [26.2842, 73.0188], [25.7317, 73.6122], [24.4800, 72.7800], [23.0225, 72.5714]
        ]
    }
]

# Major Railway Stations (Rajasthan + Major National Hubs)
NATIONWIDE_STATIONS = [
    {"code": "JP", "name": "Jaipur Jn", "lat": 26.9196, "lng": 75.7878, "zone": "NWR"},
    {"code": "JU", "name": "Jodhpur Jn", "lat": 26.2842, "lng": 73.0188, "zone": "NWR"},
    {"code": "AII", "name": "Ajmer Jn", "lat": 26.4525, "lng": 74.6399, "zone": "NWR"},
    {"code": "KOTA", "name": "Kota Jn", "lat": 25.2138, "lng": 75.8648, "zone": "WCR"},
    {"code": "UDZ", "name": "Udaipur City", "lat": 24.5800, "lng": 73.7000, "zone": "NWR"},
    {"code": "BKN", "name": "Bikaner Jn", "lat": 28.0181, "lng": 73.3174, "zone": "NWR"},
    {"code": "FL", "name": "Phulera Jn", "lat": 26.8732, "lng": 75.2415, "zone": "NWR"},
    {"code": "MJ", "name": "Marwar Jn", "lat": 25.7317, "lng": 73.6122, "zone": "NWR"},
    {"code": "NDLS", "name": "New Delhi", "lat": 28.6429, "lng": 77.2195, "zone": "NR"},
    {"code": "ADI", "name": "Ahmedabad Jn", "lat": 23.0225, "lng": 72.5714, "zone": "WR"},
    {"code": "CSMT", "name": "Mumbai CSMT", "lat": 18.9400, "lng": 72.8353, "zone": "CR"}
]

# Authentic Rajasthan Coaching Trains (North Western Railway)
TRAINS_SCHEDULE = [
    {
        "train_number": "20978",
        "train_name": "Ajmer - Delhi Vande Bharat",
        "category": "Vande Bharat",
        "priority_tier": 1,
        "color": "#0284C7",  # Sky Blue
        "loco": "Train-18 EMU",
        "heading": "242° SW",
        "stops": [
            {"station": "JP", "arr": "07:50", "dep": "07:55", "km": 0.0, "platform": 2},
            {"station": "KSG", "arr": "08:53", "dep": "08:55", "km": 105.8, "platform": 1},
            {"station": "AII", "arr": "09:40", "dep": "09:45", "km": 135.0, "platform": 1},
            {"station": "JU", "arr": "13:30", "dep": "13:30", "km": 412.0, "platform": 1}
        ]
    },
    {
        "train_number": "12461",
        "train_name": "Mandore Superfast Express",
        "category": "Superfast Express",
        "priority_tier": 2,
        "color": "#E11D48",  # Rose Red
        "loco": "WAP-7 (HOG)",
        "heading": "242° SW",
        "stops": [
            {"station": "JP", "arr": "01:20", "dep": "01:30", "km": 0.0, "platform": 3},
            {"station": "FL", "arr": "02:18", "dep": "02:20", "km": 54.6, "platform": 4},
            {"station": "AII", "arr": "03:40", "dep": "03:50", "km": 135.0, "platform": 2},
            {"station": "BER", "arr": "04:35", "dep": "04:37", "km": 187.0, "platform": 1},
            {"station": "MJ", "arr": "05:55", "dep": "06:00", "km": 275.0, "platform": 2},
            {"station": "PMY", "arr": "06:40", "dep": "06:45", "km": 342.0, "platform": 1},
            {"station": "JU", "arr": "07:55", "dep": "08:00", "km": 412.0, "platform": 2}
        ]
    },
    {
        "train_number": "12015",
        "train_name": "Ajmer Shatabdi Express",
        "category": "Shatabdi",
        "priority_tier": 2,
        "color": "#D97706",  # Amber
        "loco": "WAP-7",
        "heading": "242° SW",
        "stops": [
            {"station": "JP", "arr": "10:40", "dep": "10:45", "km": 0.0, "platform": 1},
            {"station": "KSG", "arr": "11:58", "dep": "12:00", "km": 105.8, "platform": 2},
            {"station": "AII", "arr": "12:55", "dep": "13:00", "km": 135.0, "platform": 1},
            {"station": "MJ", "arr": "14:40", "dep": "14:45", "km": 275.0, "platform": 1},
            {"station": "JU", "arr": "16:45", "dep": "16:50", "km": 412.0, "platform": 1}
        ]
    },
    {
        "train_number": "14853",
        "train_name": "Marudhar Express",
        "category": "Superfast",
        "priority_tier": 3,
        "color": "#059669",  # Emerald
        "loco": "WAP-7",
        "heading": "242° SW",
        "stops": [
            {"station": "JP", "arr": "12:10", "dep": "12:20", "km": 0.0, "platform": 4},
            {"station": "FL", "arr": "13:12", "dep": "13:14", "km": 54.6, "platform": 2},
            {"station": "AII", "arr": "14:45", "dep": "14:55", "km": 135.0, "platform": 3},
            {"station": "BER", "arr": "15:48", "dep": "15:50", "km": 187.0, "platform": 2},
            {"station": "MJ", "arr": "17:15", "dep": "17:20", "km": 275.0, "platform": 3},
            {"station": "PMY", "arr": "18:05", "dep": "18:10", "km": 342.0, "platform": 2},
            {"station": "JU", "arr": "19:40", "dep": "19:50", "km": 412.0, "platform": 3}
        ]
    },
    {
        "train_number": "12465",
        "train_name": "Ranthambhore Express",
        "category": "Superfast Express",
        "priority_tier": 3,
        "color": "#7C3AED",  # Purple
        "loco": "WAP-7",
        "heading": "242° SW",
        "stops": [
            {"station": "JP", "arr": "16:35", "dep": "16:50", "km": 0.0, "platform": 5},
            {"station": "FL", "arr": "17:42", "dep": "17:44", "km": 54.6, "platform": 3},
            {"station": "KSG", "arr": "18:30", "dep": "18:32", "km": 105.8, "platform": 1},
            {"station": "AII", "arr": "19:25", "dep": "19:35", "km": 135.0, "platform": 4},
            {"station": "BER", "arr": "20:28", "dep": "20:30", "km": 187.0, "platform": 1},
            {"station": "MJ", "arr": "21:40", "dep": "21:45", "km": 275.0, "platform": 2},
            {"station": "JU", "arr": "23:15", "dep": "23:25", "km": 412.0, "platform": 4}
        ]
    }
]
