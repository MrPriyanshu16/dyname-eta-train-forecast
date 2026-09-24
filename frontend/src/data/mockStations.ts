import { Station } from '../types/station';

export const MOCK_STATIONS: Station[] = [
  // --- PRIMARY RAJASTHAN STATE RAIL NETWORK (NWR) STATIONS ---
  {
    code: 'JU',
    name: 'Jodhpur Junction',
    city: 'Jodhpur',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 6,
    facilities: ['High-speed Wi-Fi', 'Executive Air-Conditioned Lounge', 'Waiting Rooms', 'Food Plaza', 'Battery Buggy']
  },
  {
    code: 'JP',
    name: 'Jaipur Junction',
    city: 'Jaipur',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 8,
    facilities: ['Heritage Royal Lounge', 'Free Wi-Fi', 'Food Court', 'Metro Connectivity', 'Prepaid Taxi Stand']
  },
  {
    code: 'AII',
    name: 'Ajmer Junction',
    city: 'Ajmer',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 6,
    facilities: ['Wi-Fi', 'AC Executive Lounge', 'Cloakroom', 'Dargah Pilgrim Helpdesk', 'Jan Aahar Cafeteria']
  },
  {
    code: 'FL',
    name: 'Phulera Junction',
    city: 'Phulera',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['Wi-Fi', 'Interchange Junction Concourse', 'Waiting Hall', 'Catering Stalls']
  },
  {
    code: 'KSG',
    name: 'Kishangarh',
    city: 'Kishangarh',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Marble City Exhibition Counter', 'AC Waiting Hall', 'Tea Stalls']
  },
  {
    code: 'BER',
    name: 'Beawar',
    city: 'Beawar',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Passenger Waiting Hall', 'Water Cooler Stations']
  },
  {
    code: 'MJ',
    name: 'Marwar Junction',
    city: 'Marwar',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['Wi-Fi', 'Junction Transshipment Hall', 'Retiring Rooms', 'Refreshment Canteen']
  },
  {
    code: 'PMY',
    name: 'Pali Marwar',
    city: 'Pali',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Industrial Textile Hub Info', 'Waiting Hall', 'Prepaid Auto Bay']
  },
  {
    code: 'BKN',
    name: 'Bikaner Junction',
    city: 'Bikaner',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 6,
    facilities: ['Heritage Red Sandstone Terminal', 'Wi-Fi', 'AC Retiring Rooms', 'Rajasthani Handicraft Outlets']
  },
  {
    code: 'UDZ',
    name: 'Udaipur City',
    city: 'Udaipur',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 5,
    facilities: ['City of Lakes Tourist Lounge', 'Wi-Fi', 'Food Court', 'Luggage Cloakroom', 'Prepaid Taxi']
  },
  {
    code: 'KOTA',
    name: 'Kota Junction',
    city: 'Kota',
    state: 'Rajasthan',
    zone: 'WCR',
    platforms: 6,
    facilities: ['High-speed Wi-Fi', 'Student & Transit Lounge', 'Food Plaza', 'Multi-level Waiting Hall']
  },
  {
    code: 'SWM',
    name: 'Sawai Madhopur Junction',
    city: 'Sawai Madhopur',
    state: 'Rajasthan',
    zone: 'WCR',
    platforms: 4,
    facilities: ['Ranthambore Tiger Murals & Heritage Art', 'Wi-Fi', 'Waiting Room', 'Safari Transit Desk']
  },
  {
    code: 'AWR',
    name: 'Alwar Junction',
    city: 'Alwar',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Wi-Fi', 'Executive Lounge', 'Heritage Railway Museum Corner']
  },
  {
    code: 'BKI',
    name: 'Bandikui Junction',
    city: 'Bandikui',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 4,
    facilities: ['Wi-Fi', 'Historical Railway Colony Junction', 'Refreshment Room']
  },
  {
    code: 'DO',
    name: 'Dausa',
    city: 'Dausa',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Waiting Hall', 'Water Dispensers']
  },
  {
    code: 'MTD',
    name: 'Merta Road Junction',
    city: 'Merta',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Waiting Hall', 'Tea & Snack Stalls']
  },
  {
    code: 'DNA',
    name: 'Degana Junction',
    city: 'Degana',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['Wi-Fi', 'Tea Stalls', 'Drinking Water Facilities']
  },
  {
    code: 'MKN',
    name: 'Makrana Junction',
    city: 'Makrana',
    state: 'Rajasthan',
    zone: 'NWR',
    platforms: 3,
    facilities: ['White Marble City Counter', 'Wi-Fi', 'Waiting Hall']
  },

  // --- CONNECTING EXTERNAL GATEWAYS ---
  {
    code: 'NDLS',
    name: 'New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    zone: 'NR',
    platforms: 16,
    facilities: ['High-speed Wi-Fi', 'Executive Lounge', 'Food Court', 'Metro Connectivity', 'Wheelchair Support']
  },
  {
    code: 'DLI',
    name: 'Old Delhi Junction',
    city: 'Delhi',
    state: 'Delhi',
    zone: 'NR',
    platforms: 16,
    facilities: ['Historic Red Stone Concourse', 'Wi-Fi', 'Food Court', 'Metro Connectivity']
  },
  {
    code: 'DEC',
    name: 'Delhi Cantt',
    city: 'Delhi',
    state: 'Delhi',
    zone: 'NR',
    platforms: 4,
    facilities: ['Wi-Fi', 'Executive Lounge', 'Metro Feeder']
  },
  {
    code: 'RE',
    name: 'Rewari Junction',
    city: 'Rewari',
    state: 'Haryana',
    zone: 'NWR',
    platforms: 8,
    facilities: ['Heritage Steam Shed Access', 'Wi-Fi', 'Food Plaza']
  },
  {
    code: 'ADI',
    name: 'Ahmedabad Junction',
    city: 'Ahmedabad',
    state: 'Gujarat',
    zone: 'WR',
    platforms: 12,
    facilities: ['Wi-Fi', 'Executive Lounge', 'Metro Skywalk', 'Food Court']
  },
  {
    code: 'INDB',
    name: 'Indore Junction',
    city: 'Indore',
    state: 'Madhya Pradesh',
    zone: 'WR',
    platforms: 6,
    facilities: ['Cleanliness Award Station', 'Wi-Fi', 'Food Plaza', 'Waiting Hall']
  }
];

export function getStationByCode(code: string): Station | undefined {
  return MOCK_STATIONS.find(s => s.code.toUpperCase() === code.toUpperCase());
}

export function searchStations(query: string): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_STATIONS.filter(
    s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
  );
}
