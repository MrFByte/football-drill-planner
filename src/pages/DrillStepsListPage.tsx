import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDrill } from "@/context/DrillContext"

export default function DrillStepsListPage() {
    const navigate = useNavigate()
    const { currentDrill, deleteStep } = useDrill()

    if (!currentDrill) {
        navigate('/')
        return null
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="mx-auto max-w-md px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition-colors hover:bg-slate-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">{currentDrill.title}</h1>
                        <p className="text-sm text-slate-400">{currentDrill.date}</p>
                    </div>
                </div>

                {/* Steps List */}
                <div className="mb-6">
                    <h2 className="mb-4 text-lg font-bold text-white">
                        Drill Steps ({currentDrill.steps.length})
                    </h2>

                    {currentDrill.steps.length === 0 ? (
                        <div className="rounded-2xl bg-slate-800/50 p-8 text-center">
                            <p className="text-slate-400">No steps added yet</p>
                            <p className="mt-2 text-sm text-slate-500">Click "Create New Step" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentDrill.steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-lg transition-all hover:shadow-xl cursor-pointer"
                                    onClick={() => navigate(`/drill-designer/${step.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">{step.title}</h3>
                                            {step.objective && (
                                                <p className="text-sm text-slate-300 mt-1">{step.objective}</p>
                                            )}
                                            <p className="text-sm text-slate-400 mt-1">
                                                {step.groundType} Ground • {step.fieldMeasurement === 'default' ? 'Default' : 'Custom'} Field
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteStep(step.id)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg"
                                        >
                                            <Trash2 className="h-5 w-5 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create New Step Button */}
                <Button
                    onClick={() => navigate('/create-step')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
                    size="lg"
                >
                    <Plus className="mr-2 h-6 w-6" />
                    Create New Step
                </Button>
            </div>
        </main>
    )
}
