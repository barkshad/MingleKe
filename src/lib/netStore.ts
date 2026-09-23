import { create } from 'zustand';

type NetState = {
  online: boolean;
  lowBandwidth: boolean;
  offlineReady: boolean;
  setOnline: (online: boolean) => void;
  setLowBandwidth: (low: boolean) => void;
  setOfflineReady: (ready: boolean) => void;
};

export const useNetStore = create<NetState>((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  lowBandwidth: false,
  offlineReady: false,
  setOnline: (online) => set({ online }),
  setLowBandwidth: (lowBandwidth) => set({ lowBandwidth }),
  setOfflineReady: (offlineReady) => set({ offlineReady }),
}));
