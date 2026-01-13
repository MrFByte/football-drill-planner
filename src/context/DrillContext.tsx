import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Drill {
    id: string
    title: string
    date: string
    objective: string
    category?: string
    fieldType?: 'full' | 'half' | '7v7'
    groundSize?: 'whole' | 'half'
    fieldWidth?: number
    fieldLength?: number
    steps: DrillStep[]
}

export interface DrillStep {
    id: string
    title: string
    objective?: string
    // Legacy fields kept for compatibility if needed, but will be derived from drill or unused
    fieldType?: 'full' | 'half' | '7v7'
    groundSize?: 'whole' | 'half'
    fieldWidth?: number
    fieldLength?: number
    canvasData?: any // Will store data (elements, positions)
}

interface DrillContextType {
    currentDrill: Drill | null
    setCurrentDrill: (drill: Drill | null) => void
    allDrills: Drill[]
    saveDrill: (drill: Drill) => void
    deleteDrill: (drillId: string) => void
    addStep: (step: DrillStep) => void
    updateStep: (stepId: string, step: Partial<DrillStep>) => void
    deleteStep: (stepId: string) => void
}

const DrillContext = createContext<DrillContextType | undefined>(undefined)

export function DrillProvider({ children }: { children: ReactNode }) {
    // Current active drill being edited
    const [currentDrill, setCurrentDrill] = useState<Drill | null>(() => {
        try {
            const saved = localStorage.getItem('currentDrill');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to load current drill", e);
            return null;
        }
    });

    // List of all saved drills
    const [allDrills, setAllDrills] = useState<Drill[]>(() => {
        try {
            const saved = localStorage.getItem('allDrills');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load all drills", e);
            return [];
        }
    });

    // Persist currentDrill
    useEffect(() => {
        if (currentDrill) {
            localStorage.setItem('currentDrill', JSON.stringify(currentDrill));

            // Also update this drill in the allDrills list if it exists there
            setAllDrills(prev => {
                const index = prev.findIndex(d => d.id === currentDrill.id);
                if (index >= 0) {
                    const newDrills = [...prev];
                    newDrills[index] = currentDrill;
                    return newDrills;
                }
                return prev;
            });
        }
    }, [currentDrill]);

    // Persist allDrills
    useEffect(() => {
        localStorage.setItem('allDrills', JSON.stringify(allDrills));
    }, [allDrills]);

    const saveDrill = (drill: Drill) => {
        setAllDrills(prev => {
            const exists = prev.find(d => d.id === drill.id);
            if (exists) {
                return prev.map(d => d.id === drill.id ? drill : d);
            }
            return [...prev, drill];
        });
        setCurrentDrill(drill);
    };

    const deleteDrill = (drillId: string) => {
        setAllDrills(prev => prev.filter(d => d.id !== drillId));
        if (currentDrill?.id === drillId) {
            setCurrentDrill(null);
            localStorage.removeItem('currentDrill');
        }
    };

    const addStep = (step: DrillStep) => {
        if (currentDrill) {
            setCurrentDrill({
                ...currentDrill,
                steps: [...currentDrill.steps, step]
            })
        }
    }

    const updateStep = (stepId: string, updatedStep: Partial<DrillStep>) => {
        if (currentDrill) {
            setCurrentDrill({
                ...currentDrill,
                steps: currentDrill.steps.map(step =>
                    step.id === stepId ? { ...step, ...updatedStep } : step
                )
            })
        }
    }

    const deleteStep = (stepId: string) => {
        if (currentDrill) {
            setCurrentDrill({
                ...currentDrill,
                steps: currentDrill.steps.filter(step => step.id !== stepId)
            })
        }
    }

    return (
        <DrillContext.Provider
            value={{
                currentDrill,
                setCurrentDrill,
                allDrills,
                saveDrill,
                deleteDrill,
                addStep,
                updateStep,
                deleteStep
            }}
        >
            {children}
        </DrillContext.Provider>
    )
}

export function useDrill() {
    const context = useContext(DrillContext)
    if (context === undefined) {
        throw new Error('useDrill must be used within a DrillProvider')
    }
    return context
}
