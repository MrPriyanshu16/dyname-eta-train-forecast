export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
  platforms: number;
  facilities?: string[];
}

export interface StationArrivalDeparture {
  trainNumber: string;
  trainName: string;
  trainType: string;
  origin: string;
  destination: string;
  scheduledTime: string;
  estimatedTime: string;
  delayMinutes: number;
  platform: string;
  status: 'ON_TIME' | 'DELAYED' | 'ARRIVED' | 'DEPARTED' | 'CANCELLED';
  type: 'ARRIVAL' | 'DEPARTURE';
}
