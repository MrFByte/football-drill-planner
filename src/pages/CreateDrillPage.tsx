import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDrill } from "@/context/DrillContext"

export default function CreateDrillPage() {
    const navigate = useNavigate()
    const { saveDrill } = useDrill()

    const [title, setTitle] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}

        if (!title.trim()) {
            newErrors.title = "Title is required"
        }
        if (!date) {
            newErrors.date = "Date is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (validateForm()) {
            const newDrill = {
                id: Date.now().toString(),
                title,
                date,
                steps: []
            }

            saveDrill(newDrill)
            navigate('/drill-steps')
        }
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
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New Drill</h1>
                        <p className="text-sm text-slate-400">Fill in the drill details</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Drill Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Passing and Movement"
                            className={errors.title ? "border-red-500" : ""}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-400">{errors.title}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={errors.date ? "border-red-500" : ""}
                        />
                        {errors.date && (
                            <p className="text-sm text-red-400">{errors.date}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
                        size="lg"
                    >
                        Create Drill
                    </Button>
                </form>
            </div>
        </main>
    )
}
