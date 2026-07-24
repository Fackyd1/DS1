import { create } from "zustand";
import { DEADLANDS_PHASE } from "@/features/deadlands/config/game-config";
import { createInitialDeadlandsSnapshot } from "@/features/deadlands/data/content";
import type {
  DeadlandsCommand,
  DeadlandsCommandType,
  DeadlandsMapPoint,
  DeadlandsMode,
  DeadlandsRuntimeStatus,
  DeadlandsSurvivalSnapshot,
  DeadlandsZone,
} from "@/features/deadlands/types/game";

type DeadlandsStore = {
  runtimeStatus: DeadlandsRuntimeStatus;
  activeZone: DeadlandsZone;
  highlightedPoint: DeadlandsMapPoint;
  snapshot: DeadlandsSurvivalSnapshot;
  commandQueue: DeadlandsCommand[];
  setRuntimeStatus: (status: DeadlandsRuntimeStatus) => void;
  setActiveZone: (zone: DeadlandsZone) => void;
  setHighlightedPoint: (point: DeadlandsMapPoint) => void;
  hydrateSnapshot: (snapshot: DeadlandsSurvivalSnapshot) => void;
  enqueueCommand: (type: DeadlandsCommandType, payload?: string) => void;
  drainCommands: () => DeadlandsCommand[];
  resetSnapshot: (mode?: DeadlandsMode) => void;
};

const initialSnapshot = createInitialDeadlandsSnapshot();

export const useDeadlandsStore = create<DeadlandsStore>((set, get) => ({
  runtimeStatus: "booting",
  activeZone: initialSnapshot.zone,
  highlightedPoint: initialSnapshot.mapPoint,
  snapshot: initialSnapshot,
  commandQueue: [],
  setRuntimeStatus: (runtimeStatus) => set({ runtimeStatus }),
  setActiveZone: (activeZone) => set({ activeZone }),
  setHighlightedPoint: (highlightedPoint) => set({ highlightedPoint }),
  hydrateSnapshot: (snapshot) => set({
    snapshot,
    activeZone: snapshot.zone,
    highlightedPoint: snapshot.mapPoint,
  }),
  enqueueCommand: (type, payload) =>
    set((state) => ({
      commandQueue: [...state.commandQueue, { id: `${type}-${Date.now()}-${state.commandQueue.length}`, type, payload }],
    })),
  drainCommands: () => {
    const commands = get().commandQueue;
    set({ commandQueue: [] });
    return commands;
  },
  resetSnapshot: (mode = "NORMAL") =>
    set({
      snapshot: createInitialDeadlandsSnapshot(mode),
      activeZone: createInitialDeadlandsSnapshot(mode).zone,
      highlightedPoint: createInitialDeadlandsSnapshot(mode).mapPoint,
      commandQueue: [],
    }),
}));

export const deadlandsPhaseSummary = DEADLANDS_PHASE.summary;
