import { Station } from '../types/station';

/**
 * Verified Rajasthan Railway Network Stations
 * Source of truth: rajasthan_stations table in railway_master.db (SIH 26028)
 */
export const MOCK_STATIONS: Station[] = [
  {
    code: 'JP',
    name: 'Jaipur Junction',
    city: 'Jaipur',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 8,
    facilities: ['Executive Lounge', 'High-speed Wi-Fi', 'Multi-cuisine Food Plaza', 'Retiring Rooms', 'Escalators']
  },
  {
    code: 'JU',
    name: 'Jodhpur Junction',
    city: 'Jodhpur',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['Wi-Fi', 'Air-conditioned Waiting Hall', 'Cloakroom', 'Food Court', 'Wheelchair Support']
  },
  {
    code: 'KOTA',
    name: 'Kota Junction',
    city: 'Kota',
    state: 'Rajasthan',
    zone: 'WCR',
    platforms: 6,
    facilities: ['Wi-Fi', 'Food Plaza', 'Retiring Rooms', 'Battery Operated Carts', 'Cloakroom']
  },
  {
    code: 'AII',
    name: 'Ajmer Junction',
    city: 'Ajmer',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['Wi-Fi', 'Executive Lounge', 'Dormitories', 'Cafeteria', 'Elevators']
  },
  {
    code: 'BKN',
    name: 'Bikaner Junction',
    city: 'Bikaner',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 6,
    facilities: ['Heritage Concourse', 'Free Wi-Fi', 'Food Court', 'Prepaid Taxi', 'Luggage Cloakroom']
  },
  {
    code: 'UDZ',
    name: 'Udaipur City',
    city: 'Udaipur',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['Tourist Information Counter', 'Wi-Fi', 'Air-conditioned Waiting Rooms', 'Food Plaza']
  },
  {
    code: 'SWM',
    name: 'Sawai Madhopur Junction',
    city: 'Sawai Madhopur',
    state: 'Rajasthan',
    zone: 'WCR',
    platforms: 4,
    facilities: ['Wildlife Heritage Murals', 'Wi-Fi', 'Cafeteria', 'Waiting Hall']
  },
  {
    code: 'FL',
    name: 'Phulera Junction',
    city: 'Phulera',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['Railway Canteen', 'Waiting Rooms', 'Wi-Fi', 'Water Vending Machines']
  },
  {
    code: 'BTE',
    name: 'Bharatpur Junction',
    city: 'Bharatpur',
    state: 'Rajasthan',
    zone: 'WCR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Retiring Rooms', 'Food Stalls', 'Waiting Hall']
  },
  {
    code: 'AWR',
    name: 'Alwar Junction',
    city: 'Alwar',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Waiting Room', 'Tea Stalls', 'Wheelchair Support']
  },
  {
    code: 'ABR',
    name: 'Abu Road',
    city: 'Abu Road',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Mount Abu Transit Hub', 'Wi-Fi', 'Vegetarian Refreshment Rooms', 'Retiring Rooms']
  },
  {
    code: 'MTD',
    name: 'Merta Road Junction',
    city: 'Merta',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Passenger Waiting Area', 'Refreshment Stalls']
  },
  {
    code: 'DNA',
    name: 'Degana Junction',
    city: 'Degana',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Wi-Fi', 'Waiting Room', 'Drinking Water Facilities']
  },
  {
    code: 'BKI',
    name: 'Bandikui Junction',
    city: 'Bandikui',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Wi-Fi', 'Waiting Hall', 'Refreshment Canteen']
  },
  {
    code: 'BME',
    name: 'Barmer',
    city: 'Barmer',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Border Rail Terminal', 'Wi-Fi', 'Waiting Hall', 'Retiring Rooms']
  },
  {
    code: 'JSM',
    name: 'Jaisalmer',
    city: 'Jaisalmer',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Desert Heritage Concourse', 'Tourist Desk', 'Wi-Fi', 'Air-conditioned Lounge']
  },
  {
    code: 'COR',
    name: 'Chittaurgarh Junction',
    city: 'Chittorgarh',
    state: 'Rajasthan',
    zone: 'WR',
    platforms: 5,
    facilities: ['Heritage Waiting Hall', 'Wi-Fi', 'Food Stalls', 'Cloakroom']
  },
  {
    code: 'BHL',
    name: 'Bhilwara',
    city: 'Bhilwara',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Textile City Hub', 'Wi-Fi', 'Waiting Rooms', 'Food Plaza']
  },
  {
    code: 'KSG',
    name: 'Kishangarh',
    city: 'Kishangarh',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 2,
    facilities: ['Marble City Station', 'Wi-Fi', 'Waiting Rooms', 'Water Coolers']
  },
  {
    code: 'MJ',
    name: 'Marwar Junction',
    city: 'Marwar',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Heritage Junction', 'Wi-Fi', 'Waiting Rooms', 'Refreshment Room']
  },
  {
    code: 'FA',
    name: 'Falna',
    city: 'Falna',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Ranakpur Temple Gateway', 'Wi-Fi', 'Waiting Hall', 'Taxi Stand']
  },
  {
    code: 'CUR',
    name: 'Churu Junction',
    city: 'Churu',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Shekhawati Gateway', 'Wi-Fi', 'Waiting Room', 'Canteen']
  },
  {
    code: 'HMH',
    name: 'Hanumangarh Junction',
    city: 'Hanumangarh',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Wi-Fi', 'Waiting Hall', 'Tea Stalls', 'Water Coolers']
  },
  {
    code: 'SGNR',
    name: 'Sri Ganganagar',
    city: 'Sri Ganganagar',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Canal City Terminal', 'Wi-Fi', 'Retiring Rooms', 'Food Plaza']
  }
];

export const getStationByCode = (code: string): Station | undefined => {
  return MOCK_STATIONS.find(s => s.code.toUpperCase() === code.toUpperCase());
};

export const searchStations = (query: string): Station[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MOCK_STATIONS.filter(
    s =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
  );
};
