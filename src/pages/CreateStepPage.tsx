import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDrill } from "@/context/DrillContext"

// FIFA Standard Dimensions in meters
const FIFA_DIMENSIONS = {
    '7v7': { width: 55, height: 37 },
    '11v11': { width: 105, height: 68 }
}

export default function CreateStepPage() {
    const navigate = useNavigate()
    const { addStep } = useDrill()

    const [title, setTitle] = useState("")
    const [objective, setObjective] = useState("")
    const [groundType, setGroundType] = useState<'full' | 'half'>('full')
    const [fieldType, setFieldType] = useState<'7v7' | '11v11'>('7v7')
    const [fieldMeasurement, setFieldMeasurement] = useState<'default' | 'custom'>('default')
    const [unit, setUnit] = useState<'yard' | 'meter'>('meter')
    const [width, setWidth] = useState<number>(55)
    const [height, setHeight] = useState<number>(37)
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    // Update default dimensions when fieldType changes
    useEffect(() => {
        if (fieldMeasurement === 'default') {
            const dimensions = FIFA_DIMENSIONS[fieldType]
            setWidth(dimensions.width)
            setHeight(dimensions.height)
            setUnit('meter')
        }
    }, [fieldType, fieldMeasurement])

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}

        if (!title.trim()) {
            newErrors.title = "Title is required"
        }

        if (fieldMeasurement === 'custom') {
            if (!width || width <= 0) {
                newErrors.width = "Width must be greater than 0"
            }
            if (!height || height <= 0) {
                newErrors.height = "Height must be greater than 0"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (validateForm()) {
            const newStep = {
                id: Date.now().toString(),
                title,
                objective,
                groundType,
                fieldType,
                fieldMeasurement,
                ...(fieldMeasurement === 'custom' && {
                    unit,
                    width,
                    height
                })
            }

            addStep(newStep)
            navigate(`/drill-designer/${newStep.id}`)
        }
    }

    const currentDimensions = fieldMeasurement === 'default'
        ? FIFA_DIMENSIONS[fieldType]
        : { width, height }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="mx-auto max-w-md px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/drill-steps')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition-colors hover:bg-slate-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New Step</h1>
                        <p className="text-sm text-slate-400">Define the drill step</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Step Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Initial Setup"
                            className={errors.title ? "border-red-500" : ""}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-400">{errors.title}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="objective">Objective</Label>
                        <Textarea
                            id="objective"
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Describe the objective for this step..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="groundType">Ground Type *</Label>
                        <Select
                            id="groundType"
                            value={groundType}
                            onChange={(e) => setGroundType(e.target.value as 'full' | 'half')}
                        >
                            <option value="full">Full Ground</option>
                            <option value="half">Half Ground</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fieldType">Field Type *</Label>
                        <Select
                            id="fieldType"
                            value={fieldType}
                            onChange={(e) => setFieldType(e.target.value as '7v7' | '11v11')}
                        >
                            <option value="7v7">7 vs 7</option>
                            <option value="11v11">11 vs 11</option>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Field Measurement</Label>
                        <RadioGroup
                            value={fieldMeasurement}
                            onValueChange={(value: string) => setFieldMeasurement(value as 'default' | 'custom')}
                            className="flex flex-col space-y-3"
                        >
                            <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="default" id="step-default" />
                                    <Label htmlFor="step-default" className="font-normal cursor-pointer">
                                        Default (FIFA Standard)
                                    </Label>
                                </div>
                                {fieldMeasurement === 'default' && (
                                    <p className="ml-6 text-sm text-emerald-400">
                                        {fieldType === '7v7' ? '55m × 37m' : '105m × 68m'}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="custom" id="step-custom" />
                                    <Label htmlFor="step-custom" className="font-normal cursor-pointer">
                                        Custom
                                    </Label>
                                </div>

                                {fieldMeasurement === 'custom' && (
                                    <div className="ml-6 space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-300">Unit</Label>
                                            <RadioGroup
                                                value={unit}
                                                onValueChange={(value: string) => setUnit(value as 'yard' | 'meter')}
                                                className="flex space-x-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="meter" id="unit-meter" />
                                                    <Label htmlFor="unit-meter" className="font-normal cursor-pointer text-sm">
                                                        Meter
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="yard" id="unit-yard" />
                                                    <Label htmlFor="unit-yard" className="font-normal cursor-pointer text-sm">
                                                        Yard
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="width" className="text-xs text-slate-300">Width</Label>
                                                <Input
                                                    id="width"
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => setWidth(Number(e.target.value))}
                                                    placeholder="50"
                                                    min="1"
                                                    className={errors.width ? "border-red-500" : ""}
                                                />
                                                {errors.width && (
                                                    <p className="text-xs text-red-400">{errors.width}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="height" className="text-xs text-slate-300">Height</Label>
                                                <Input
                                                    id="height"
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => setHeight(Number(e.target.value))}
                                                    placeholder="30"
                                                    min="1"
                                                    className={errors.height ? "border-red-500" : ""}
                                                />
                                                {errors.height && (
                                                    <p className="text-xs text-red-400">{errors.height}</p>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-400">
                                            {currentDimensions.width} {unit}s × {currentDimensions.height} {unit}s
                                        </p>
                                    </div>
                                )}
                            </div>
                        </RadioGroup>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
                        size="lg"
                    >
                        Create Step
                    </Button>
                </form>
            </div>
        </main>
    )
}
