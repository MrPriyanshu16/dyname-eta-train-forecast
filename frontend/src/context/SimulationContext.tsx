import React, { createContext, useContext, useState, useEffect } from 'react';
import { Train, RunningState } from '../types/train';
import { INITIAL_TRAINS } from '../data/mockTrains';
import { DEMO_SCENARIOS } from '../data/scenarios';
import { addMinutesToTime } from '../utils/time';

interface SimulationContextType {
  trains: Train[];
  getTrainById: (id: string) => Train | undefined;
  simulatedTime: string;
  advanceSimulatedTime: (minutes: number) => void;
  activeScenarioId: string;
  applyScenario: (scenarioId: string) => void;
  updateTrainDelay: (trainId: string, newDelayMinutes: number) => void;
  updateTrainState: (trainId: string, newState: RunningState) => void;
  savedTrainIds: string[];
  toggleSaveTrain: (trainId: string) => void;
  isTrainSaved: (trainId: string) => boolean;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  selectedTargetStations: Record<string, string>;
  setSelectedTargetStation: (trainId: string, stationCode: string) => void;
  resetToDefaults: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const SAVED_TRAINS_KEY = 'trackline_saved_trains_v1';
const RECENT_SEARCHES_KEY = 'trackline_recent_searches_v1';

import { getCurrentISTString } from '../utils/time';

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trains, setTrains] = useState<Train[]>(INITIAL_TRAINS);
  const [simulatedTime, setSimulatedTime] = useState<string>(() => getCurrentISTString());
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-c'); // Default to Mumbai Rajdhani at Kota
  const [selectedTargetStations, setSelectedTargetStations] = useState<Record<string, string>>({});

  // Continuously sync with live India time every 10 seconds if not manually adjusted
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTime(getCurrentISTString());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Saved trains in localStorage
  const [savedTrainIds, setSavedTrainIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_TRAINS_KEY);
      return stored ? JSON.parse(stored) : ['12951', '22436'];
    } catch {
      return ['12951', '22436'];
    }
  });

  // Recent searches in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : ['12951 Mumbai Rajdhani', 'NDLS New Delhi', '22436 Vande Bharat'];
    } catch {
      return ['12951 Mumbai Rajdhani', 'NDLS New Delhi', '22436 Vande Bharat'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_TRAINS_KEY, JSON.stringify(savedTrainIds));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [savedTrainIds]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch (e) {
      console.error('Failed to save recent searches', e);
    }
  }, [recentSearches]);

  const getTrainById = (id: string) => {
    return trains.find(t => t.id === id || t.number === id);
  };

  const advanceSimulatedTime = (minutes: number) => {
    // Parse simulated time "10:42 AM"
    const [time, period] = simulatedTime.split(' ');
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    let totalMins = h * 60 + m + minutes;
    if (totalMins < 0) totalMins += 1440;
    totalMins = totalMins % 1440;

    let newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    const newPeriod = newH >= 12 ? 'PM' : 'AM';
    newH = newH % 12;
    if (newH === 0) newH = 12;

    const newTimeStr = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')} ${newPeriod}`;
    setSimulatedTime(newTimeStr);

    // Update timestamp on all trains
    setTrains(prev =>
      prev.map(t => ({
        ...t,
        currentStatus: {
          ...t.currentStatus,
          lastUpdated: newTimeStr
        }
      }))
    );
  };

  const applyScenario = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    // Reset trains to initial base or specific scenario tweaks
    setTrains(prev =>
      prev.map(t => {
        if (t.id === scenario.trainId) {
          // Reset to default scenario state
          const defaultTrain = INITIAL_TRAINS.find(orig => orig.id === scenario.trainId);
          return defaultTrain ? { ...defaultTrain } : t;
        }
        return t;
      })
    );
  };

  const updateTrainDelay = (trainId: string, newDelayMinutes: number) => {
    setTrains(prev =>
      prev.map(t => {
        if (t.id !== trainId) return t;

        // Recalculate upcoming stops estimates
        const updatedStops = t.stops.map(stop => {
          if (stop.status === 'COMPLETED') {
            return stop;
          }
          return {
            ...stop,
            delayArrivalMinutes: newDelayMinutes,
            delayDepartureMinutes: newDelayMinutes,
            estimatedArrival: stop.scheduledArrival === '--' ? '--' : addMinutesToTime(stop.scheduledArrival, newDelayMinutes),
            estimatedDeparture: stop.scheduledDeparture === '--' ? '--' : addMinutesToTime(stop.scheduledDeparture, newDelayMinutes)
          };
        });

        const newState: RunningState =
          newDelayMinutes > 15
            ? 'DELAYED'
            : newDelayMinutes > 0
            ? t.currentStatus.state === 'STANDING_AT_STATION'
              ? 'STANDING_AT_STATION'
              : 'DELAYED'
            : t.currentStatus.state === 'COMPLETED'
            ? 'COMPLETED'
            : 'ON_TIME';

        return {
          ...t,
          currentStatus: {
            ...t.currentStatus,
            delayMinutes: newDelayMinutes,
            state: newState,
            statusExplanation:
              newDelayMinutes > 0
                ? `Running ${newDelayMinutes} minutes behind scheduled section run.`
                : 'Running on time according to simulated schedule.'
          },
          stops: updatedStops
        };
      })
    );
  };

  const updateTrainState = (trainId: string, newState: RunningState) => {
    setTrains(prev =>
      prev.map(t => {
        if (t.id !== trainId) return t;
        return {
          ...t,
          currentStatus: {
            ...t.currentStatus,
            state: newState
          }
        };
      })
    );
  };

  const toggleSaveTrain = (trainId: string) => {
    setSavedTrainIds(prev =>
      prev.includes(trainId) ? prev.filter(id => id !== trainId) : [...prev, trainId]
    );
  };

  const isTrainSaved = (trainId: string) => {
    return savedTrainIds.includes(trainId);
  };

  const addRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 8);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const setSelectedTargetStation = (trainId: string, stationCode: string) => {
    setSelectedTargetStations(prev => ({
      ...prev,
      [trainId]: stationCode
    }));
  };

  const resetToDefaults = () => {
    setTrains(INITIAL_TRAINS);
    setSimulatedTime('10:42 AM');
    setActiveScenarioId('scenario-c');
    setSelectedTargetStations({});
  };

  return (
    <SimulationContext.Provider
      value={{
        trains,
        getTrainById,
        simulatedTime,
        advanceSimulatedTime,
        activeScenarioId,
        applyScenario,
        updateTrainDelay,
        updateTrainState,
        savedTrainIds,
        toggleSaveTrain,
        isTrainSaved,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        selectedTargetStations,
        setSelectedTargetStation,
        resetToDefaults
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
