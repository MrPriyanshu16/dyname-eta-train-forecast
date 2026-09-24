import { SimulationScenario } from '../types/train';

export const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scenario-a',
    name: 'Scenario A: Mandore Superfast Express (22491)',
    description: 'Mandore Superfast Express departing Jodhpur Junction (JU) towards Jaipur and Delhi.',
    trainId: '22491',
    badge: 'Rajasthan Superfast'
  },
  {
    id: 'scenario-b',
    name: 'Scenario B: Barmer - Rishikesh Express (14888)',
    description: 'Barmer to Rishikesh desert express traversing Jodhpur, Merta Road, and Bikaner.',
    trainId: '14888',
    badge: 'Desert Express'
  },
  {
    id: 'scenario-c',
    name: 'Scenario C: Mumbai Rajdhani at Kota Junction (12951)',
    description: 'Mumbai Rajdhani (12951) halted at Platform 1 of Kota Junction with live ETA forecasting.',
    trainId: '12951',
    badge: 'Halted at Kota'
  },
  {
    id: 'scenario-d',
    name: 'Scenario D: Ajmer Vande Bharat (20977)',
    description: 'Ajmer - Delhi Cantt Vande Bharat Express cruising through Jaipur and Alwar corridors.',
    trainId: '20977',
    badge: 'Semi-High Speed'
  },
  {
    id: 'scenario-e',
    name: 'Scenario E: Mandore Express Downlink (22492)',
    description: 'Mandore Superfast Express returning from Delhi (DLI) to Jodhpur Junction.',
    trainId: '22492',
    badge: 'Return Service'
  }
];
