"use client";

import { useReducer, useEffect, useCallback, useMemo } from "react";

export type ServiceCounts = {
    adults: number;
    kids: number;
    babies: number;
};

export type ServiceType = "main" | "kids";

export interface CounterState {
    activeTab: ServiceType;
    mainService: ServiceCounts;
    kidsService: ServiceCounts;
    mainHistory: ServiceCounts[];
    kidsHistory: ServiceCounts[];
    date: string; // YYYY-MM-DD
}

type CounterAction =
    | { type: "INCREMENT"; category: keyof ServiceCounts }
    | { type: "DECREMENT"; category: keyof ServiceCounts }
    | { type: "UNDO" }
    | { type: "CLEAR_TAB" }
    | { type: "SWITCH_TAB"; tab: ServiceType }
    | { type: "HYDRATE"; state: Partial<CounterState> }
    | { type: "RESET_ALL" };

const initialState: CounterState = {
    activeTab: "main",
    mainService: { adults: 0, kids: 0, babies: 0 },
    kidsService: { adults: 0, kids: 0, babies: 0 },
    mainHistory: [],
    kidsHistory: [],
    date: new Date().toISOString().split("T")[0],
};

const MAX_HISTORY = 10;

function counterReducer(state: CounterState, action: CounterAction): CounterState {
    const currentTab = state.activeTab;
    const currentCounts = currentTab === "main" ? state.mainService : state.kidsService;
    const currentHistory = currentTab === "main" ? state.mainHistory : state.kidsHistory;

    switch (action.type) {
        case "INCREMENT": {
            const newCounts = {
                ...currentCounts,
                [action.category]: currentCounts[action.category] + 1,
            };

            const newHistory = [currentCounts, ...currentHistory].slice(0, MAX_HISTORY);

            return {
                ...state,
                [currentTab === "main" ? "mainService" : "kidsService"]: newCounts,
                [currentTab === "main" ? "mainHistory" : "kidsHistory"]: newHistory,
            };
        }

        case "DECREMENT": {
            if (currentCounts[action.category] <= 0) return state;

            const newCounts = {
                ...currentCounts,
                [action.category]: currentCounts[action.category] - 1,
            };

            const newHistory = [currentCounts, ...currentHistory].slice(0, MAX_HISTORY);

            return {
                ...state,
                [currentTab === "main" ? "mainService" : "kidsService"]: newCounts,
                [currentTab === "main" ? "mainHistory" : "kidsHistory"]: newHistory,
            };
        }

        case "UNDO": {
            if (currentHistory.length === 0) return state;

            const previousCounts = currentHistory[0];
            const remainingHistory = currentHistory.slice(1);

            return {
                ...state,
                [currentTab === "main" ? "mainService" : "kidsService"]: previousCounts,
                [currentTab === "main" ? "mainHistory" : "kidsHistory"]: remainingHistory,
            };
        }

        case "CLEAR_TAB": {
            return {
                ...state,
                [currentTab === "main" ? "mainService" : "kidsService"]: { adults: 0, kids: 0, babies: 0 },
                [currentTab === "main" ? "mainHistory" : "kidsHistory"]: [],
            };
        }

        case "SWITCH_TAB":
            return { ...state, activeTab: action.tab };

        case "HYDRATE":
            return { ...state, ...action.state };

        case "RESET_ALL":
            return { ...initialState, date: new Date().toISOString().split("T")[0] };

        default:
            return state;
    }
}

export function useCounterState() {
    const [state, dispatch] = useReducer(counterReducer, initialState);

    // Initialize from persistence
    useEffect(() => {
        const saved = localStorage.getItem("flockometer_draft");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const today = new Date().toISOString().split("T")[0];

                // Auto-reset if the stored date is from a different day
                if (parsed.date !== today) {
                    localStorage.removeItem("flockometer_draft");
                    dispatch({ type: "RESET_ALL" });
                } else {
                    dispatch({ type: "HYDRATE", state: parsed });
                }
            } catch (e) {
                console.error("Failed to parse local draft", e);
            }
        }
    }, []);

    // Save to persistence (with debounce simulation via useEffect)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem("flockometer_draft", JSON.stringify(state));
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [state]);

    const activeCounts = useMemo(() => {
        return state.activeTab === "main" ? state.mainService : state.kidsService;
    }, [state.activeTab, state.mainService, state.kidsService]);

    const canUndo = useMemo(() => {
        return (state.activeTab === "main" ? state.mainHistory : state.kidsHistory).length > 0;
    }, [state.activeTab, state.mainHistory, state.kidsHistory]);

    const handleIncrement = useCallback((category: keyof ServiceCounts) => {
        dispatch({ type: "INCREMENT", category });
    }, []);

    const handleDecrement = useCallback((category: keyof ServiceCounts) => {
        dispatch({ type: "DECREMENT", category });
    }, []);

    const handleUndo = useCallback(() => {
        dispatch({ type: "UNDO" });
    }, []);

    const handleClearTab = useCallback(() => {
        dispatch({ type: "CLEAR_TAB" });
    }, []);

    const handleSwitchTab = useCallback((tab: ServiceType) => {
        dispatch({ type: "SWITCH_TAB", tab });
    }, []);

    const handleReset = useCallback(() => {
        dispatch({ type: "RESET_ALL" });
        localStorage.removeItem("flockometer_draft");
    }, []);

    return {
        state,
        activeCounts,
        canUndo,
        increment: handleIncrement,
        decrement: handleDecrement,
        undo: handleUndo,
        clearTab: handleClearTab,
        switchTab: handleSwitchTab,
        resetAll: handleReset,
    };
}
