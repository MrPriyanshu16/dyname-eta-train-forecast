import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
RAW_DATA_DIR = DATA_DIR / 'raw'
PROCESSED_DATA_DIR = DATA_DIR / 'processed'
MODELS_DIR = BASE_DIR / 'models'

RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Random Seed for Reproducibility
RANDOM_SEED = 42

# High-Density Target Trunk Corridor: New Delhi (NDLS) to Kanpur Central (CNB) (440 km)
# Part of Golden Quadrilateral (Northern Railway / North Central Railway)
CORRIDOR_STATIONS = [
    {'code': 'NDLS', 'name': 'New Delhi', 'km': 0.0, 'lat': 28.6429, 'lng': 77.2195, 'platforms': 16, 'is_junction': True, 'tier': 1, 'zone': 'NR', 'division': 'DLI'},
    {'code': 'GZB', 'name': 'Ghaziabad Jn', 'km': 25.6, 'lat': 28.6679, 'lng': 77.4326, 'platforms': 6, 'is_junction': True, 'tier': 1, 'zone': 'NR', 'division': 'DLI'},
    {'code': 'ALJN', 'name': 'Aligarh Jn', 'km': 126.0, 'lat': 27.8974, 'lng': 78.0880, 'platforms': 7, 'is_junction': True, 'tier': 1, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'HRS', 'name': 'Hathras Jn', 'km': 157.0, 'lat': 27.6019, 'lng': 78.0560, 'platforms': 3, 'is_junction': False, 'tier': 2, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'TDL', 'name': 'Tundla Jn', 'km': 204.2, 'lat': 27.2081, 'lng': 78.2393, 'platforms': 5, 'is_junction': True, 'tier': 1, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'SKB', 'name': 'Shikohabad Jn', 'km': 244.0, 'lat': 27.1085, 'lng': 78.5840, 'platforms': 3, 'is_junction': False, 'tier': 2, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'ETW', 'name': 'Etawah Jn', 'km': 297.0, 'lat': 26.7725, 'lng': 79.0306, 'platforms': 5, 'is_junction': True, 'tier': 1, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'PHD', 'name': 'Phaphund', 'km': 355.0, 'lat': 26.5612, 'lng': 79.4625, 'platforms': 2, 'is_junction': False, 'tier': 2, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'RURA', 'name': 'Rura', 'km': 396.0, 'lat': 26.4915, 'lng': 79.9012, 'platforms': 2, 'is_junction': False, 'tier': 2, 'zone': 'NCR', 'division': 'PRYJ'},
    {'code': 'CNB', 'name': 'Kanpur Central', 'km': 440.3, 'lat': 26.4542, 'lng': 80.3507, 'platforms': 10, 'is_junction': True, 'tier': 1, 'zone': 'NCR', 'division': 'PRYJ'}
]

# Track Sections along Corridor
CORRIDOR_SECTIONS = [
    {'id': 'SEC-1', 'from': 'NDLS', 'to': 'GZB', 'length_km': 25.6, 'tracks': 4, 'mps_kmh': 110, 'capacity_trains': 6},
    {'id': 'SEC-2', 'from': 'GZB', 'to': 'ALJN', 'length_km': 100.4, 'tracks': 3, 'mps_kmh': 130, 'capacity_trains': 8},
    {'id': 'SEC-3', 'from': 'ALJN', 'to': 'HRS', 'length_km': 31.0, 'tracks': 2, 'mps_kmh': 130, 'capacity_trains': 4},
    {'id': 'SEC-4', 'from': 'HRS', 'to': 'TDL', 'length_km': 47.2, 'tracks': 2, 'mps_kmh': 130, 'capacity_trains': 5},
    {'id': 'SEC-5', 'from': 'TDL', 'to': 'SKB', 'length_km': 39.8, 'tracks': 2, 'mps_kmh': 130, 'capacity_trains': 4},
    {'id': 'SEC-6', 'from': 'SKB', 'to': 'ETW', 'length_km': 53.0, 'tracks': 2, 'mps_kmh': 130, 'capacity_trains': 5},
    {'id': 'SEC-7', 'from': 'ETW', 'to': 'PHD', 'length_km': 58.0, 'tracks': 2, 'mps_kmh': 130, 'capacity_trains': 4},
    {'id': 'SEC-8', 'from': 'PHD', 'to': 'RURA', 'length_km': 41.0, 'tracks': 2, 'mps_kmh': 130, 'capacity_trains': 4},
    {'id': 'SEC-9', 'from': 'RURA', 'to': 'CNB', 'length_km': 44.3, 'tracks': 3, 'mps_kmh': 130, 'capacity_trains': 6}
]

# Real Premium Coaching Trains running on this trunk route
CORRIDOR_TRAINS = [
    {
        'train_number': '22436',
        'train_name': 'Vande Bharat Express',
        'train_type': 'Vande Bharat',
        'priority_tier': 1,
        'zone': 'NR',
        'origin': 'NDLS',
        'destination': 'BSB',
        'mps_kmh': 130,
        'scheduled_departure_time': '06:00',
        'stops': ['NDLS', 'CNB']
    },
    {
        'train_number': '12302',
        'train_name': 'Howrah Rajdhani Express',
        'train_type': 'Rajdhani',
        'priority_tier': 1,
        'zone': 'ER',
        'origin': 'NDLS',
        'destination': 'HWH',
        'mps_kmh': 130,
        'scheduled_departure_time': '16:50',
        'stops': ['NDLS', 'CNB']
    },
    {
        'train_number': '12004',
        'train_name': 'Lucknow Shatabdi Express',
        'train_type': 'Shatabdi',
        'priority_tier': 2,
        'zone': 'NR',
        'origin': 'NDLS',
        'destination': 'LKO',
        'mps_kmh': 130,
        'scheduled_departure_time': '06:10',
        'stops': ['NDLS', 'GZB', 'ALJN', 'TDL', 'ETW', 'PHD', 'CNB']
    },
    {
        'train_number': '12566',
        'train_name': 'Bihar Sampark Kranti Express',
        'train_type': 'Superfast',
        'priority_tier': 3,
        'zone': 'ECR',
        'origin': 'NDLS',
        'destination': 'DBG',
        'mps_kmh': 110,
        'scheduled_departure_time': '13:00',
        'stops': ['NDLS', 'GZB', 'ALJN', 'TDL', 'CNB']
    },
    {
        'train_number': '12418',
        'train_name': 'Prayagraj Express',
        'train_type': 'Superfast',
        'priority_tier': 3,
        'zone': 'NCR',
        'origin': 'NDLS',
        'destination': 'PRYJ',
        'mps_kmh': 130,
        'scheduled_departure_time': '22:10',
        'stops': ['NDLS', 'GZB', 'ALJN', 'CNB']
    },
    {
        'train_number': '14218',
        'train_name': 'Unchahar Express',
        'train_type': 'Express',
        'priority_tier': 4,
        'zone': 'NR',
        'origin': 'CDG',
        'destination': 'PYGS',
        'mps_kmh': 100,
        'scheduled_departure_time': '21:30',
        'stops': ['NDLS', 'GZB', 'ALJN', 'HRS', 'TDL', 'SKB', 'ETW', 'PHD', 'RURA', 'CNB']
    },
    {
        'train_number': '12876',
        'train_name': 'Neelachal Express',
        'train_type': 'Superfast',
        'priority_tier': 3,
        'zone': 'ECoR',
        'origin': 'ANVT',
        'destination': 'PURI',
        'mps_kmh': 110,
        'scheduled_departure_time': '07:30',
        'stops': ['NDLS', 'GZB', 'ALJN', 'TDL', 'ETW', 'CNB']
    },
    {
        'train_number': '12398',
        'train_name': 'Mahabodhi Express',
        'train_type': 'Superfast',
        'priority_tier': 3,
        'zone': 'ECR',
        'origin': 'NDLS',
        'destination': 'GAYA',
        'mps_kmh': 130,
        'scheduled_departure_time': '12:50',
        'stops': ['NDLS', 'ALJN', 'CNB']
    },
    {
        'train_number': '12461',
        'train_name': 'Mandore Superfast Express',
        'train_type': 'Superfast',
        'priority_tier': 3,
        'zone': 'NWR',
        'origin': 'DLI',
        'destination': 'JU',
        'mps_kmh': 110,
        'scheduled_departure_time': '21:15',
        'stops': ['NDLS', 'GZB', 'ALJN', 'TDL', 'CNB']
    },
    {
        'train_number': '54308',
        'train_name': 'Delhi - Aligarh Passenger',
        'train_type': 'Passenger',
        'priority_tier': 5,
        'zone': 'NR',
        'origin': 'NDLS',
        'destination': 'ALJN',
        'mps_kmh': 75,
        'scheduled_departure_time': '05:45',
        'stops': ['NDLS', 'GZB', 'ALJN']
    },
    {
        'train_number': '64582',
        'train_name': 'Tundla - Kanpur MEMU',
        'train_type': 'MEMU',
        'priority_tier': 5,
        'zone': 'NCR',
        'origin': 'TDL',
        'destination': 'CNB',
        'mps_kmh': 80,
        'scheduled_departure_time': '06:15',
        'stops': ['TDL', 'SKB', 'ETW', 'PHD', 'RURA', 'CNB']
    },
    {
        'train_number': '64102',
        'train_name': 'Delhi - Ghaziabad Suburban EMU',
        'train_type': 'Suburban',
        'priority_tier': 5,
        'zone': 'NR',
        'origin': 'NDLS',
        'destination': 'GZB',
        'mps_kmh': 70,
        'scheduled_departure_time': '08:00',
        'stops': ['NDLS', 'GZB']
    }
]

# Validation Thresholds
GPS_MAX_DISTANCE_FROM_CORRIDOR_KM = 3.0  # Beyond this, flagged as UNCERTAIN or INCONSISTENT
GPS_MAX_FEASIBLE_SPEED_KMH = 180.0       # Higher indicates GPS jumping anomaly
GPS_MAX_TIME_GAP_MINUTES = 15.0          # Higher indicates missing observation gap
