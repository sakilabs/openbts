import { useReducer } from "react";

import type { LocationWithStations, UkeLocationWithPermits, UkeStation } from "@/types/station";

export type NearbyPanel = {
  coords: { lat: number; lng: number };
  locations: (LocationWithStations & { distance: number })[];
};

export type UkeStationPanel = {
  location: UkeLocationWithPermits;
  stations: UkeStation[];
};

type PanelState = {
  nearbyPanel: NearbyPanel | null;
  ukeStationPanel: UkeStationPanel | null;
};

type PanelAction =
  | { type: "SELECT_LOCATION" }
  | { type: "SELECT_UKE"; location: UkeLocationWithPermits; stations: UkeStation[] }
  | { type: "NEARBY"; coords: { lat: number; lng: number }; locations: (LocationWithStations & { distance: number })[] }
  | { type: "CLEAR_NEARBY" }
  | { type: "CLEAR_UKE" }
  | { type: "CLEAR_BOTH" };

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "SELECT_LOCATION":
      return { nearbyPanel: null, ukeStationPanel: null };
    case "SELECT_UKE":
      return { nearbyPanel: null, ukeStationPanel: { location: action.location, stations: action.stations } };
    case "NEARBY":
      return { nearbyPanel: { coords: action.coords, locations: action.locations }, ukeStationPanel: null };
    case "CLEAR_NEARBY":
      return { ...state, nearbyPanel: null };
    case "CLEAR_UKE":
      return { ...state, ukeStationPanel: null };
    case "CLEAR_BOTH":
      return { nearbyPanel: null, ukeStationPanel: null };
    default:
      return state;
  }
}

export function useLocationPickerState() {
  const [panelState, dispatchPanel] = useReducer(panelReducer, { nearbyPanel: null, ukeStationPanel: null });

  return {
    nearbyPanel: panelState.nearbyPanel,
    ukeStationPanel: panelState.ukeStationPanel,
    dispatchPanel,
  };
}
