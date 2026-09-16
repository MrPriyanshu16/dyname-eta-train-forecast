import { SimulationScenario } from '../types/train';

export const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scenario-a',
    name: 'Scenario A: On-Time High-Speed Service',
    description: 'Vande Bharat Express (22436) running precisely on-time, approaching Kanpur Central at 124 km/h.',
    trainId: '22436',
    badge: 'On Time (0 min)'
  },
  {
    id: 'scenario-b',
    name: 'Scenario B: Delayed Trunk Express',
    description: 'Kerala Express (12626) running 38 minutes late due to caution orders, dynamically re-projecting upcoming arrival times.',
    trainId: '12626',
    badge: 'Delayed (38 min)'
  },
  {
    id: 'scenario-c',
    name: 'Scenario C: Standing at Station Platform',
    description: 'Mumbai Rajdhani (12951) halted at Platform 1 of Kota Junction with active halt countdown.',
    trainId: '12951',
    badge: 'Halted at Platform'
  },
  {
    id: 'scenario-d',
    name: 'Scenario D: Cruising Between Stations',
    description: 'Lucknow Shatabdi (12004) between Aligarh and Tundla corridor, speed ~112 km/h.',
    trainId: '12004',
    badge: 'Between Stations'
  },
  {
    id: 'scenario-e',
    name: 'Scenario E: Completed Journey',
    description: 'Howrah Rajdhani (12302) arrived at destination New Delhi on Platform 16.',
    trainId: '12302',
    badge: 'Journey Completed'
  }
];
