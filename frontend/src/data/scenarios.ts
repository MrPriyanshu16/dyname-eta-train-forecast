import { SimulationScenario } from '../types/train';

export const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scenario-a',
    name: 'Scenario A: On-Time Semi-High Speed',
    description: 'Vande Bharat Express (20978) running precisely on-time, approaching Jaipur Junction at 128 km/h.',
    trainId: '20978',
    badge: 'On Time (0 min)'
  },
  {
    id: 'scenario-b',
    name: 'Scenario B: Delayed Trunk Superfast',
    description: 'Mandore Superfast (12461) delayed by 24 mins near Pali Marwar due to desert sandstorm caution order.',
    trainId: '12461',
    badge: 'Delayed (24 min)'
  },
  {
    id: 'scenario-c',
    name: 'Scenario C: Standing at Station Platform',
    description: 'Ajmer Shatabdi (12015) halted at Platform 1 of Jaipur Junction with active passenger boarding countdown.',
    trainId: '12015',
    badge: 'Halted at Platform'
  },
  {
    id: 'scenario-d',
    name: 'Scenario D: Cruising Between Stations',
    description: 'Marudhar Express (14853) between Phulera and Kishangarh corridor, speed ~104 km/h.',
    trainId: '14853',
    badge: 'Between Stations'
  },
  {
    id: 'scenario-e',
    name: 'Scenario E: Completed Journey',
    description: 'Ranthambhore Superfast (12465) arrived at destination Jodhpur Junction Platform 4.',
    trainId: '12465',
    badge: 'Journey Completed'
  }
];
