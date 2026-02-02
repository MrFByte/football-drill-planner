import { Button } from "@/components/ui/button"
import { Plus, Calendar, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useDrill } from "@/context/DrillContext"

export default function DrillCategoriesPage() {
    const navigate = useNavigate()
    const { allDrills, setCurrentDrill, deleteDrill } = useDrill()

    const handleSelectDrill = (drill: any) => {
        setCurrentDrill(drill)
        // If it has steps, go to steps list, else maybe designer?
        // Following flow: always to steps list
        navigate('/drill-steps')
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this drill?')) {
            deleteDrill(id);
        }
    }

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100">
            <div className="mx-auto max-w-md px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-white">Sessions List</h1>
                    <p className="text-slate-400">Manage your training sessions</p>
                </div>

                {/* Create New Button */}
                <Button
                    onClick={() => navigate('/create-drill')}
                    className="mb-8 w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg font-semibold shadow-lg active:scale-[0.98] transition-all"
                >
                    <Plus className="mr-2 h-6 w-6" />
                    Create New Drill
                </Button>

                {/* Saved Drills List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-300 px-1">Saved Drills ({allDrills.length})</h2>

                    {allDrills.length === 0 && (
                        <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
                            <p className="text-slate-500">No drills found. Create one to get started!</p>
                        </div>
                    )}

                    {allDrills.map((drill) => (
                        <div
                            key={drill.id}
                            onClick={() => handleSelectDrill(drill)}
                            className="group relative overflow-hidden rounded-2xl bg-slate-800 p-5 shadow-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{drill.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                        <Calendar size={12} />
                                        <span>{drill.date}</span>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleDelete(e, drill.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-full"
                                        title="Delete Drill"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-wide ml-auto">
                                    {drill.steps.length} Steps
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
