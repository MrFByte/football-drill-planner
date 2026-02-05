import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    X,
    ArrowLeft,
    User,
    Trash2Icon,
    Move,
} from 'lucide-react';
import { useDrill } from '@/context/DrillContext';

interface PitchElement {
    instanceId: number;
    id: string;
    type: 'player' | 'icon' | 'shape' | 'equipment' | 'marker' | 'line';
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    color?: string;
    label?: string;
    isGK?: boolean;
    isDefender?: boolean;
    icon?: string;
    variant?: string;
    dashed?: boolean;
    shaded?: boolean;
    fixedColor?: boolean;
    // Line-specific properties
    points?: { x: number, y: number }[];
    lineStyle?: 'solid' | 'dotted' | 'dribble';
    drawMode?: 'straight' | 'freehand';
}

interface DrawingPath {
    id: number;
    points: { x: number, y: number }[];
    color: string;
    dashed: boolean;
}

const COLORS = [
    { id: 'green', value: '#10b981', label: 'Green' },
    { id: 'blue', value: '#3b82f6', label: 'Blue' },
    { id: 'yellow', value: '#fbbf24', label: 'Yellow' },
    { id: 'red', value: '#ef4444', label: 'Red' },
    { id: 'black', value: '#000000', label: 'Black' },
    { id: 'white', value: '#ffffff', label: 'White' },
];

const ASSETS = {
    players: [
        { id: 'player', type: 'player' as const, label: 'Player', width: 5, height: 4 },
        { id: 'gk', type: 'player' as const, label: 'GK', isGK: true, width: 5, height: 4 },
        { id: 'defender', type: 'player' as const, label: 'Defender', isDefender: true, width: 5, height: 4 },
        { id: 'x-mark', type: 'marker' as const, variant: 'x', label: 'X', width: 5, height: 4 },
        { id: 'circle-empty', type: 'marker' as const, variant: 'circle', label: 'Circle', width: 5, height: 4 },
    ],
    equipment: [
        { id: 'ball', type: 'icon' as const, icon: '⚽', label: 'Ball', fixedColor: true, width: 0.25, height: 0.25 },
        { id: 'cone', type: 'equipment' as const, variant: 'cone', label: 'Cone', width: 4, height: 4 },
        { id: 'marker', type: 'equipment' as const, variant: 'marker', label: 'Disc', width: 4, height: 4 },
        { id: 'pole', type: 'equipment' as const, variant: 'pole', label: 'Pole', width: 3, height: 4 },
        { id: 'hurdle', type: 'equipment' as const, variant: 'hurdle', label: 'Hurdle', width: 8, height: 6 },
        { id: '5sgoal', type: 'equipment' as const, variant: '5sgoal', label: 'S Goal Post', width: 15, height: 8 },
        { id: 'minigoal', type: 'equipment' as const, variant: 'minigoal', label: 'Goal Post', width: 20, height: 6 },
        { id: 'ladder', type: 'equipment' as const, variant: 'ladder', label: 'Ladder', width: 15, height: 5 },
    ],
    shapes: [
        { id: 'square', type: 'shape' as const, variant: 'square', label: 'Square', width: 10, height: 10 },
        { id: 'square-dash', type: 'shape' as const, variant: 'square', label: 'Sq Dot', width: 10, height: 10, dashed: true },
        { id: 'square-shade', type: 'shape' as const, variant: 'square', label: 'Sq Shade', width: 10, height: 10, shaded: true },
        { id: 'circle', type: 'shape' as const, variant: 'circle', label: 'Circle', width: 10, height: 10 },
        { id: 'circle-dash', type: 'shape' as const, variant: 'circle', label: 'Cir Dot', width: 10, height: 10, dashed: true },
        { id: 'circle-shade', type: 'shape' as const, variant: 'circle', label: 'Cir Shade', width: 10, height: 10, shaded: true },
        { id: 'rect', type: 'shape' as const, variant: 'rect', label: 'Rect', width: 15, height: 8 },
        { id: 'rect-dash', type: 'shape' as const, variant: 'rect', label: 'Rec Dot', width: 15, height: 8, dashed: true },
        { id: 'rect-shade', type: 'shape' as const, variant: 'rect', label: 'Rec Shade', width: 15, height: 8, shaded: true },
    ],
    arrows: [
        { id: 'straight-dotted', type: 'line' as const, lineStyle: 'dotted' as const, drawMode: 'straight' as const, label: 'Dot Line' },
        { id: 'freehand-dotted', type: 'line' as const, lineStyle: 'dotted' as const, drawMode: 'freehand' as const, label: 'Dot Free' },
        // { id: 'straight-dribble', type: 'line' as const, lineStyle: 'dribble' as const, drawMode: 'straight' as const, label: 'Dribble' },
        // { id: 'freehand-dribble', type: 'line' as const, lineStyle: 'dribble' as const, drawMode: 'freehand' as const, label: 'Drib Free' },
        { id: 'freehand-solid', type: 'line' as const, lineStyle: 'solid' as const, drawMode: 'freehand' as const, label: 'Free Line' },
        { id: 'straight-solid', type: 'line' as const, lineStyle: 'solid' as const, drawMode: 'straight' as const, label: 'Line' },
    ]
};

const DrillDesignerPage = () => {
    const navigate = useNavigate();
    const { stepId } = useParams<{ stepId: string }>();
    const { currentDrill, updateStep } = useDrill();
    const currentStep = currentDrill?.steps.find(step => step.id === stepId);

    const [elements, setElements] = useState<PitchElement[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'players' | 'equipment' | 'shapes' | 'arrows'>('players');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [paths, setPaths] = useState<DrawingPath[]>([]);
    const [draggedAsset, setDraggedAsset] = useState<any>(null);
    const [touchDragPos, setTouchDragPos] = useState<{ x: number, y: number } | null>(null);

    // Line drawing state
    const [selectedLineType, setSelectedLineType] = useState<any>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState<{ x: number, y: number }[]>([]);

    // Shape drawing state
    const [isDrawingShape, setIsDrawingShape] = useState(false);
    const [drawingShapeType, setDrawingShapeType] = useState<any>(null);
    const [drawingShapeStart, setDrawingShapeStart] = useState<{ x: number, y: number } | null>(null);
    const [currentShapeDimensions, setCurrentShapeDimensions] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    // Interaction modes
    const [moveMode, setMoveMode] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);

    const pitchRef = useRef<HTMLDivElement>(null);

    // Pitch dimensions for SVG
    const pitchWidth = 400;
    const pitchHeight = 600;

    // Load existing elements
    useEffect(() => {
        if (currentStep && (currentStep as any).canvasData?.elements) {
            setElements((currentStep as any).canvasData.elements);
        }
        if (currentStep && (currentStep as any).canvasData?.paths) {
            setPaths((currentStep as any).canvasData.paths);
        }
    }, [currentStep]);

    // Handle save
    const handleSave = () => {
        if (!currentStep || !stepId) return;
        updateStep(stepId, { canvasData: { elements, paths } } as any);
        navigate('/drill-steps');
    };

    // Clear all
    const handleClear = () => {
        setElements([]);
        setPaths([]);
        setSelectedId(null);
    };

    // Undo last action
    const handleUndo = () => {
        if (paths.length > 0) {
            setPaths(prev => prev.slice(0, -1));
        } else if (elements.length > 0) {
            setElements(prev => prev.slice(0, -1));
        }
    };

    // Handle adding elements via drag/drop only
    const addElementToPitch = (asset: any, clientX: number, clientY: number) => {
        if (!pitchRef.current) return;
        const rect = pitchRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        const newElement: PitchElement = {
            ...asset,
            instanceId: Date.now(),
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            color: asset.fixedColor ? undefined : selectedColor,
            width: asset.width || 5,
            height: asset.height || 5,
            rotation: 0
        };

        setElements((prev) => [...prev, newElement]);
        setSelectedId(null);
    };

    // Drag start from toolbar
    const handleDragStart = (e: React.DragEvent, asset: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Touch start from toolbar (mobile)
    const handleTouchStart = (e: React.TouchEvent, asset: any) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggedAsset(asset);
        const touch = e.touches[0];
        setTouchDragPos({ x: touch.clientX, y: touch.clientY });
    };

    // Touch move (mobile)
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggedAsset) return;
        const touch = e.touches[0];
        setTouchDragPos({ x: touch.clientX, y: touch.clientY });
    };

    // Touch end on pitch (mobile)
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!draggedAsset) return;
        const touch = e.changedTouches[0];
        addElementToPitch(draggedAsset, touch.clientX, touch.clientY);
        setDraggedAsset(null);
        setTouchDragPos(null);
    };

    // Drop on pitch
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        try {
            const assetData = e.dataTransfer.getData('application/json');
            if (assetData) {
                const asset = JSON.parse(assetData);
                addElementToPitch(asset, e.clientX, e.clientY);
            }
        } catch (err) {
            console.error('Failed to parse dropped asset', err);
        }
    };

    // Handle element drag
    const handleElementDrag = (instanceId: number, e: any) => {
        if (!pitchRef.current) return;
        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setElements(prev => prev.map(el =>
            el.instanceId === instanceId
                ? { ...el, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
                : el
        ));
    };

    // Delete selected element
    // Mode toggle handlers
    const toggleMoveMode = () => {
        setMoveMode(!moveMode);
        setDeleteMode(false);
        setSelectedLineType(null);
        setDrawingShapeType(null);
        setSelectedId(null);
    };

    const toggleDeleteMode = () => {
        setDeleteMode(!deleteMode);
        setMoveMode(false);
        setSelectedLineType(null);
        setDrawingShapeType(null);
        setSelectedId(null);
    };

    const handleDeleteElement = (instanceId: number) => {
        setElements(prev => prev.filter(el => el.instanceId !== instanceId));
    };

    // Line drawing handlers
    const handleLineDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!selectedLineType || selectedLineType.type !== 'line') return;
        if (!pitchRef.current) return;

        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setIsDrawing(true);
        setCurrentLine([{ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }]);
    };

    const handleLineDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !selectedLineType || !pitchRef.current) return;

        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        const newPoint = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };

        if (selectedLineType.drawMode === 'freehand') {
            // Add point to path for freehand drawing
            setCurrentLine(prev => [...prev, newPoint]);
        } else {
            // For straight lines, just update the end point
            setCurrentLine(prev => [prev[0], newPoint]);
        }
    };

    const handleLineDrawEnd = () => {
        if (!isDrawing || !selectedLineType || currentLine.length < 2) {
            setIsDrawing(false);
            setCurrentLine([]);
            return;
        }

        // Create the line element
        const newLine: PitchElement = {
            instanceId: Date.now(),
            id: selectedLineType.id,
            type: 'line',
            x: currentLine[0].x,
            y: currentLine[0].y,
            color: '#000000',  // Always black
            points: currentLine,
            lineStyle: selectedLineType.lineStyle,
            drawMode: selectedLineType.drawMode,
        };

        setElements(prev => [...prev, newLine]);
        setIsDrawing(false);
        setCurrentLine([]);
    };

    // Shape drawing handlers
    const handleShapeDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawingShapeType || drawingShapeType.type !== 'shape') return;
        if (!pitchRef.current) return;

        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setIsDrawingShape(true);
        setDrawingShapeStart({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
        setCurrentShapeDimensions({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), width: 0, height: 0 });
    };

    const handleShapeDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingShape || !drawingShapeStart || !pitchRef.current) return;

        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const currentX = ((clientX - rect.left) / rect.width) * 100;
        const currentY = ((clientY - rect.top) / rect.height) * 100;

        const clampedCurrentX = Math.max(0, Math.min(100, currentX));
        const clampedCurrentY = Math.max(0, Math.min(100, currentY));

        const x = Math.min(drawingShapeStart.x, clampedCurrentX);
        const y = Math.min(drawingShapeStart.y, clampedCurrentY);
        const width = Math.abs(clampedCurrentX - drawingShapeStart.x);
        const height = Math.abs(clampedCurrentY - drawingShapeStart.y);

        setCurrentShapeDimensions({ x, y, width, height });
    };

    const handleShapeDrawEnd = () => {
        if (!isDrawingShape || !drawingShapeType || !currentShapeDimensions || currentShapeDimensions.width < 1 || currentShapeDimensions.height < 1) {
            setIsDrawingShape(false);
            setDrawingShapeStart(null);
            setCurrentShapeDimensions(null);
            return;
        }

        // Create the shape element
        const newShape: PitchElement = {
            instanceId: Date.now(),
            id: drawingShapeType.id,
            type: 'shape',
            variant: drawingShapeType.variant,
            x: currentShapeDimensions.x + currentShapeDimensions.width / 2,
            y: currentShapeDimensions.y + currentShapeDimensions.height / 2,
            width: currentShapeDimensions.width,
            height: currentShapeDimensions.height,
            color: selectedColor,
            dashed: drawingShapeType.dashed || false,
            shaded: drawingShapeType.shaded || false,
            rotation: 0,
        };

        setElements(prev => [...prev, newShape]);
        setIsDrawingShape(false);
        setDrawingShapeStart(null);
        setCurrentShapeDimensions(null);
        setDrawingShapeType(null); // Deactivate drawing mode after creating shape
    };




    if (!currentStep) return <div>Loading...</div>;

    return (
        <div className="fixed inset-0 bg-[#09090b] flex flex-col h-screen w-screen overflow-hidden font-sans">

            {/* ========== HEADER (5%) ========== */}
            <header className="h-[5vh] min-h-[45px] bg-[#18181b] border-b border-white/10 flex items-center justify-between px-4 z-50 shrink-0">
                {/* Left: Back Button */}
                <div className="flex items-center w-1/4">
                    <button
                        onClick={() => navigate('/drill-steps')}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {/* Center: Clear & Undo */}
                <div className="flex items-center justify-center w-2/4 h-full">
                    <div className="flex items-center bg-[#27272a] rounded-md p-0.5 h-[80%]">
                        <button
                            onClick={handleClear}
                            className="flex items-center justify-center px-4 h-full text-zinc-300 hover:text-white hover:bg-white/5 rounded-sm transition-colors text-[10px] font-medium uppercase tracking-wide"
                        >
                            Clear
                        </button>
                        <div className="w-[1px] h-3 bg-white/10 mx-1" />
                        <button
                            onClick={handleUndo}
                            className="flex items-center justify-center px-4 h-full text-zinc-300 hover:text-white hover:bg-white/5 rounded-sm transition-colors text-[10px] font-medium uppercase tracking-wide"
                        >
                            Undo
                        </button>
                        <button
                            onClick={() => setIsViewMode(!isViewMode)}
                            className={`flex items-center justify-center px-4 h-full rounded-sm transition-colors text-[10px] font-medium uppercase tracking-wide ${isViewMode
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'text-zinc-300 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isViewMode ? 'Edit' : 'View'}
                        </button>
                    </div>
                </div>

                {/* Right: Save Button */}
                <div className="flex items-center justify-end w-1/4">
                    <button
                        onClick={handleSave}
                        className="text-blue-500 font-semibold text-xs hover:text-blue-400 uppercase tracking-wider"
                    >
                        Save
                    </button>
                </div>
            </header>

            {/* ========== FIELD (60% in edit, 95% in view) ========== */}
            <main className={`bg-[#121212] flex items-center justify-center p-2 relative shrink-0 ${isViewMode ? 'h-[95vh]' : 'h-[60vh]'
                }`}>
                {/* Pitch Container */}
                <div
                    ref={pitchRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onMouseDown={(e) => {
                        if (selectedLineType) {
                            handleLineDrawStart(e);
                        } else if (drawingShapeType) {
                            handleShapeDrawStart(e);
                        }
                    }}
                    onMouseMove={(e) => {
                        if (isDrawing) {
                            handleLineDrawMove(e);
                        } else if (isDrawingShape) {
                            handleShapeDrawMove(e);
                        } else {
                            handleTouchMove(e as any);
                        }
                    }}
                    onMouseUp={() => {
                        if (isDrawing) {
                            handleLineDrawEnd();
                        } else if (isDrawingShape) {
                            handleShapeDrawEnd();
                        }
                    }}
                    onTouchStart={(e) => {
                        if (selectedLineType) {
                            handleLineDrawStart(e);
                        } else if (drawingShapeType) {
                            handleShapeDrawStart(e);
                        }
                    }}
                    onTouchMove={(e) => {
                        if (isDrawing) {
                            handleLineDrawMove(e);
                        } else if (isDrawingShape) {
                            handleShapeDrawMove(e);
                        } else {
                            handleTouchMove(e);
                        }
                    }}
                    onTouchEnd={(e) => {
                        if (isDrawing) {
                            handleLineDrawEnd();
                        } else if (isDrawingShape) {
                            handleShapeDrawEnd();
                        } else {
                            handleTouchEnd(e);
                        }
                    }}
                    onClick={() => {
                        if (!isDrawing && !isDrawingShape) {
                            setSelectedId(null);
                            setMoveMode(false);
                            setDeleteMode(false);
                        }
                    }}
                    className={`relative h-full aspect-[2/3] max-w-full bg-[#2e7d32] shadow-2xl border-[3px] border-[#388e3c] overflow-hidden rounded-md transition-transform duration-300 ${isViewMode ? 'scale-110' : ''
                        }`}
                >
                    {/* Grass Stripes */}
                    <div className="absolute inset-0 flex flex-col opacity-30 pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/10' : 'bg-transparent'}`} />
                        ))}
                    </div>

                    {/* SVG Field Markings */}
                    <svg
                        viewBox={currentStep?.groundType === 'half'
                            ? `0 ${pitchHeight / 2} ${pitchWidth} ${pitchHeight / 2}`
                            : `0 0 ${pitchWidth} ${pitchHeight}`}
                        className="absolute inset-0 w-full h-full stroke-white/70 fill-none stroke-[2] pointer-events-none"
                    >
                        {/* Field Borders */}
                        {currentStep?.groundType === 'half' ? (
                            /* Half Ground: Only bottom half borders */
                            <>
                            
                                <rect x="10" y={pitchHeight / 2} width={pitchWidth - 20} height={pitchHeight / 2 - 10} />
                                
                                <line x1="10" y1={pitchHeight / 2} x2={pitchWidth - 10} y2={pitchHeight / 2} />
                                <path d={`M ${pitchWidth / 2 - 40} ${pitchHeight / 2} A 40 40 0 0 0 ${pitchWidth / 2 + 40} ${pitchHeight / 2}`} />
                                <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="2" fill="white" />

                                {/* Bottom Penalty Box */}
                                <rect x={pitchWidth / 4} y={pitchHeight - 90} width={pitchWidth / 2} height="80" />
                                <rect x={pitchWidth / 3} y={pitchHeight - 40} width={pitchWidth / 3} height="30" />
                                <path d={`M ${pitchWidth / 2 - 35} ${pitchHeight - 90} Q ${pitchWidth / 2} ${pitchHeight - 115} ${pitchWidth / 2 + 35} ${pitchHeight - 90}`} />
                            </>
                        ) : (
                            /* Full Ground: Complete field */
                            <>
                                <rect x="10" y="10" width={pitchWidth - 20} height={pitchHeight - 20} />
                                <line x1="10" y1={pitchHeight / 2} x2={pitchWidth - 10} y2={pitchHeight / 2} />
                                <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="40" />
                                <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="2" fill="white" />

                                {/* Top Penalty Box */}
                                <rect x={pitchWidth / 4} y="10" width={pitchWidth / 2} height="80" />
                                <rect x={pitchWidth / 3} y="10" width={pitchWidth / 3} height="30" />
                                <path d={`M ${pitchWidth / 2 - 35} 90 Q ${pitchWidth / 2} 115 ${pitchWidth / 2 + 35} 90`} />

                                {/* Bottom Penalty Box */}
                                <rect x={pitchWidth / 4} y={pitchHeight - 90} width={pitchWidth / 2} height="80" />
                                <rect x={pitchWidth / 3} y={pitchHeight - 40} width={pitchWidth / 3} height="30" />
                                <path d={`M ${pitchWidth / 2 - 35} ${pitchHeight - 90} Q ${pitchWidth / 2} ${pitchHeight - 115} ${pitchWidth / 2 + 35} ${pitchHeight - 90}`} />
                            </>
                        )}
                    </svg>

                    {/* Rendered Elements */}
                    {elements.map((el) => {
                        const isSelected = selectedId === el.instanceId;

                        // Skip rendering lines here - they're rendered separately in SVG
                        if (el.type === 'line') return null;

                        return (
                            <div
                                key={el.instanceId}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (deleteMode) {
                                        handleDeleteElement(el.instanceId);
                                    } else if (!moveMode) {
                                        setSelectedId(el.instanceId);
                                    }
                                }}
                                onMouseDown={(e) => {
                                    if (!moveMode && !deleteMode) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (deleteMode) return;
                                    setSelectedId(el.instanceId);
                                    const moveHandler = (moveEvent: MouseEvent) => handleElementDrag(el.instanceId, moveEvent);
                                    const upHandler = () => {
                                        window.removeEventListener('mousemove', moveHandler);
                                        window.removeEventListener('mouseup', upHandler);
                                    };
                                    window.addEventListener('mousemove', moveHandler);
                                    window.addEventListener('mouseup', upHandler);
                                }}
                                onTouchStart={(e) => {
                                    if (!moveMode && !deleteMode) return;
                                    if (deleteMode) return;
                                    e.stopPropagation();
                                    setSelectedId(el.instanceId);
                                    const currentInstanceId = el.instanceId;
                                    const touchMoveHandler = (touchEvent: TouchEvent) => {
                                        if (!pitchRef.current || touchEvent.touches.length === 0) return;
                                        const touch = touchEvent.touches[0];
                                        const rect = pitchRef.current.getBoundingClientRect();
                                        const x = ((touch.clientX - rect.left) / rect.width) * 100;
                                        const y = ((touch.clientY - rect.top) / rect.height) * 100;
                                        setElements(prev => prev.map(element =>
                                            element.instanceId === currentInstanceId
                                                ? { ...element, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
                                                : element
                                        ));
                                    };
                                    const touchUpHandler = () => {
                                        window.removeEventListener('touchmove', touchMoveHandler);
                                        window.removeEventListener('touchend', touchUpHandler);
                                    };
                                    window.addEventListener('touchmove', touchMoveHandler);
                                    window.addEventListener('touchend', touchUpHandler);
                                }}
                                className={`absolute cursor-move transition-all pointer-events-auto flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-500 z-[150]' : 'z-[100]'}`}
                                style={{
                                    left: `${el.x}%`,
                                    top: `${el.y}%`,
                                    width: `${el.width}%`,
                                    height: `${el.height}%`,
                                    transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                                }}
                            >
                                {/* Render Player */}
                                {el.type === 'player' && (
                                    <div
                                        className="w-full h-full rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: el.color }}
                                    >
                                        {el.isGK ? (
                                            <span className="text-white font-bold text-xs">G</span>
                                        ) : el.isDefender ? (
                                            <span className="text-white font-bold text-xs">D</span>
                                        ) : (
                                            <User size={14} className="text-white" />
                                        )}
                                    </div>
                                )}

                                {/* Render Marker (X and Empty Circle) */}
                                {el.type === 'marker' && (
                                    <div
                                        className="w-full h-full rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: el.color }}
                                    >
                                        {el.variant === 'x' && <X size={14} className="text-white" />}
                                    </div>
                                )}

                                {/* Render Icon (Ball) */}
                                {el.type === 'icon' && (
                                    <span className="text-[0.4rem]">{el.icon}</span>
                                )}

                                {/* Render Equipment */}
                                {el.type === 'equipment' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {el.variant === 'cone' && (
                                            <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                                                {/* Base */}
                                                <polygon points="12,52 52,52 52,60 12,60" fill="#ff7a00" />
                                                {/* Cone body */}
                                                <polygon points="32,6 48,52 16,52" fill="#ff8c1a" />
                                                {/* Highlight */}
                                                <polygon points="32,10 38,52 30,52" fill="#ffa64d" opacity="0.9" />
                                            </svg>
                                        )}
                                        {el.variant === 'marker' && (
                                            <svg
                                                width="1em"
                                                height="1em"
                                                viewBox="0 0 64 64"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-full h-full"
                                            >
                                                <circle cx="32" cy="32" r="20" fill={el.color} />
                                            </svg>
                                        )}
                                        {el.variant === 'pole' && (
                                            <svg
                                                viewBox="0 0 64 128"
                                                className="w-full h-full"
                                                fill={el.color}
                                            >
                                                {/* Ground base */}
                                                <rect x="19" y="114" width="26" height="14" rx="2" />

                                                {/* Pole (2× height) */}
                                                <rect x="26.5" y="0" width="10" height="128" rx="2" />
                                            </svg>

                                        )}
                                        {el.variant === 'hurdle' && (
                                            <svg width="2em" height="2em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"
                                                fill={el.color}
                                            >
                                                {/* <!--Left stand--> */}
                                                <rect x="14" y="30" width="2" height="20" rx="2" />
                                                {/* <!--Right stand--> */}
                                                <rect x="48" y="30" width="2" height="20" rx="2" />
                                                {/* <!--Cross bar (hurdle)--> */}
                                                <rect x="12" y="28" width="40" height="4" rx="2" />
                                            </svg>
                                            // <div className="w-full h-2/3 border-t-4 border-x-4 rounded-t-lg" style={{ borderColor: el.color }}></div>
                                        )}
                                        {el.variant === '5sgoal' && (
                                            <svg
                                                width="2em"
                                                height="2em"
                                                viewBox="0 0 64 64"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill={el.color}
                                            >
                                                {/* Left post */}
                                                <rect x="14" y="22" width="3" height="20" rx="1.5" />
                                                {/* Right post */}
                                                <rect x="46" y="22" width="3" height="20" rx="1.5" />
                                                {/* Crossbar */}
                                                <rect x="14" y="22" width="35" height="3" rx="1.5" />
                                                {/* Net (horizontal lines) */}
                                                <rect x="14" y="27" width="35" height="0.8" opacity="0.6" />
                                                <rect x="14" y="31" width="35" height="0.8" opacity="0.6" />
                                                <rect x="14" y="35" width="35" height="0.8" opacity="0.6" />
                                                <rect x="14" y="39" width="35" height="0.8" opacity="0.6" />
                                                {/* Net (vertical hints) */}
                                                <rect x="22" y="25" width="0.8" height="14" opacity="0.5" />
                                                <rect x="32" y="25" width="0.8" height="14" opacity="0.5" />
                                                <rect x="40" y="25" width="0.8" height="14" opacity="0.5" />
                                            </svg>
                                        )}
                                        {el.variant === 'minigoal' && (
                                            // <div className="w-full h-full border-2 relative" style={{ borderColor: el.color }}>
                                            //     <div className="w-full h-full border border-dashed border-current opacity-50"></div>
                                            // </div>
                                            <svg
                                                width="em"
                                                height="2em"
                                                viewBox="0 0 256 256"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                {/* <!-- Left post --> */}
                                                <rect x="24" y="88" width="12" height="96" rx="6" />

                                                {/* <!-- Right post --> */}
                                                <rect x="220" y="88" width="12" height="96" rx="6" />

                                                {/* <!-- Crossbar --> */}
                                                <rect x="24" y="88" width="208" height="12" rx="6" />

                                                {/* <!-- Net (horizontal lines) --> */}
                                                <rect x="24" y="108" width="208" height="3.2" opacity="0.6" />
                                                <rect x="24" y="124" width="208" height="3.2" opacity="0.6" />
                                                <rect x="24" y="140" width="208" height="3.2" opacity="0.6" />
                                                <rect x="24" y="156" width="208" height="3.2" opacity="0.6" />
                                                <rect x="24" y="172" width="208" height="3.2" opacity="0.6" />

                                                {/* <!-- Net (vertical hints) --> */}
                                                <rect x="64" y="100" width="3.2" height="84" opacity="0.5" />
                                                <rect x="128" y="100" width="3.2" height="84" opacity="0.5" />
                                                <rect x="192" y="100" width="3.2" height="84" opacity="0.5" />
                                            </svg>

                                        )}
                                        {el.variant === 'ladder' && (
                                            // <div className="w-full h-full flex border-y-2" style={{ borderColor: el.color }}>
                                            //     <div className="flex-1 border-r-2 border-current"></div>
                                            //     <div className="flex-1 border-r-2 border-current"></div>
                                            //     <div className="flex-1"></div>
                                            // </div>
                                            <svg className="w-full h-full" viewBox="14 6 14 46" xmlns="http://www.w3.org/2000/svg">
                                                {/* <!--Side rails--> */}
                                                <rect x="16" y="8" width="2" height="48" rx="2" fill={el.color} />
                                                <rect x="30" y="8" width="2" height="48" rx="2" fill={el.color} />
                                                {/* <!--Rungs (3 bars)--> */}
                                                <rect x="17" y="16" width="15" height="2" rx="2" fill="#DADADA" />
                                                <rect x="17" y="30" width="15" height="2" rx="2" fill="#DADADA" />
                                                <rect x="17" y="44" width="15" height="2" rx="2" fill="#DADADA" />
                                            </svg>

                                        )}
                                    </div>
                                )}

                                {/* Render Shapes */}
                                {el.type === 'shape' && (
                                    <>
                                        {el.variant === 'rect' && (
                                            <div
                                                className={`w-full h-full border-2 ${el.dashed ? 'border-dashed' : ''}`}
                                                style={{
                                                    borderColor: el.color,
                                                    backgroundColor: el.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                }}
                                            ></div>
                                        )}
                                        {el.variant === 'square' && (
                                            <div
                                                className={`w-full h-full border-2 ${el.dashed ? 'border-dashed' : ''}`}
                                                style={{
                                                    borderColor: el.color,
                                                    backgroundColor: el.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                }}
                                            ></div>
                                        )}
                                        {el.variant === 'circle' && (
                                            <div
                                                className={`w-full h-full border-2 rounded-full ${el.dashed ? 'border-dashed' : ''}`}
                                                style={{
                                                    borderColor: el.color,
                                                    backgroundColor: el.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                }}
                                            ></div>
                                        )}
                                    </>
                                )}


                            </div>
                        );
                    })}

                    {/* Render Lines as SVG Paths */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${pitchWidth} ${pitchHeight}`}>
                        <defs>
                            <marker id="arrowhead-line" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                <polyline points="1,1 7,4 1,7" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                        </defs>

                        {/* Render completed lines */}
                        {elements.filter(el => el.type === 'line').map((line) => {
                            if (!line.points || line.points.length < 2) return null;

                            const points = line.points.map(p => ({
                                x: (p.x / 100) * pitchWidth,
                                y: (p.y / 100) * pitchHeight
                            }));

                            const isSelected = selectedId === line.instanceId;

                            // Generate path based on line style
                            let pathElement;

                            if (line.lineStyle === 'dribble') {
                                // Determine parameters based on draw mode
                                const isFreehand = line.drawMode === 'freehand';
                                const amplitude = isFreehand ? 10 : 6;  // Larger waves for freehand
                                const frequency = isFreehand ? 0.12 : 0.2;  // Lower frequency (smoother) for freehand

                                const wavePoints = [];
                                let cumulativeDistance = 0;

                                for (let i = 0; i < points.length - 1; i++) {
                                    const p1 = points[i];
                                    const p2 = points[i + 1];
                                    const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                                    const steps = Math.max(Math.floor(distance / 2), 15);

                                    for (let j = 0; j <= steps; j++) {
                                        const t = j / steps;
                                        const baseX = p1.x + (p2.x - p1.x) * t;
                                        const baseY = p1.y + (p2.y - p1.y) * t;

                                        const dx = p2.x - p1.x;
                                        const dy = p2.y - p1.y;
                                        const length = Math.sqrt(dx * dx + dy * dy);
                                        const perpX = -dy / length;
                                        const perpY = dx / length;

                                        const currentDistance = cumulativeDistance + (t * distance);
                                        const waveOffset = Math.sin(currentDistance * frequency * Math.PI) * amplitude;
                                        const x = baseX + perpX * waveOffset;
                                        const y = baseY + perpY * waveOffset;

                                        wavePoints.push({ x, y });
                                    }

                                    cumulativeDistance += distance;
                                }

                                // Create smooth path using quadratic bezier curves
                                let pathData = `M ${wavePoints[0].x} ${wavePoints[0].y}`;
                                for (let i = 1; i < wavePoints.length - 1; i += 2) {
                                    const p1 = wavePoints[i];
                                    const p2 = wavePoints[Math.min(i + 1, wavePoints.length - 1)];
                                    pathData += ` Q ${p1.x} ${p1.y}, ${p2.x} ${p2.y}`;
                                }
                                // If we have an odd number of points, add the last one
                                if (wavePoints.length % 2 === 0) {
                                    const last = wavePoints[wavePoints.length - 1];
                                    pathData += ` L ${last.x} ${last.y}`;
                                }

                                pathElement = (
                                    <>
                                        {/* Invisible wider stroke for better click detection */}
                                        <path
                                            key={`${line.instanceId}-hitarea`}
                                            d={pathData}
                                            fill="none"
                                            stroke="transparent"
                                            strokeWidth="15"
                                            className="pointer-events-auto cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (deleteMode) {
                                                    handleDeleteElement(line.instanceId);
                                                } else {
                                                    setSelectedId(line.instanceId);
                                                }
                                            }}
                                        />
                                        {/* Visible path */}
                                        <path
                                            key={line.instanceId}
                                            d={pathData}
                                            fill="none"
                                            stroke="#000000"
                                            strokeWidth={isSelected ? "4" : "3"}
                                            markerEnd="url(#arrowhead-line)"
                                            className="pointer-events-none"
                                        />
                                    </>
                                );
                            } else if (line.drawMode === 'freehand') {
                                // Smooth curve for freehand
                                const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                pathElement = (
                                    <>
                                        {/* Invisible wider stroke for better click detection */}
                                        <path
                                            key={`${line.instanceId}-hitarea`}
                                            d={pathData}
                                            fill="none"
                                            stroke="transparent"
                                            strokeWidth="15"
                                            className="pointer-events-auto cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (deleteMode) {
                                                    handleDeleteElement(line.instanceId);
                                                } else {
                                                    setSelectedId(line.instanceId);
                                                }
                                            }}
                                        />
                                        {/* Visible path */}
                                        <path
                                            key={line.instanceId}
                                            d={pathData}
                                            fill="none"
                                            stroke="#000000"
                                            strokeWidth={isSelected ? "4" : "3"}
                                            strokeDasharray={line.lineStyle === 'dotted' ? '5,5' : 'none'}
                                            markerEnd="url(#arrowhead-line)"
                                            className="pointer-events-none"
                                        />
                                    </>
                                );
                            } else {
                                // Straight line
                                const start = points[0];
                                const end = points[points.length - 1];
                                pathElement = (
                                    <>
                                        {/* Invisible wider stroke for better click detection */}
                                        <line
                                            key={`${line.instanceId}-hitarea`}
                                            x1={start.x}
                                            y1={start.y}
                                            x2={end.x}
                                            y2={end.y}
                                            stroke="transparent"
                                            strokeWidth="15"
                                            className="pointer-events-auto cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (deleteMode) {
                                                    handleDeleteElement(line.instanceId);
                                                } else {
                                                    setSelectedId(line.instanceId);
                                                }
                                            }}
                                        />
                                        {/* Visible line */}
                                        <line
                                            key={line.instanceId}
                                            x1={start.x}
                                            y1={start.y}
                                            x2={end.x}
                                            y2={end.y}
                                            stroke="#000000"
                                            strokeWidth={isSelected ? "4" : "3"}
                                            strokeDasharray={line.lineStyle === 'dotted' ? '5,5' : 'none'}
                                            markerEnd="url(#arrowhead-line)"
                                            className="pointer-events-none"
                                        />
                                    </>
                                );
                            }

                            return pathElement;
                        })}

                        {/* Render current line being drawn */}
                        {isDrawing && currentLine.length >= 2 && selectedLineType && (
                            (() => {
                                const points = currentLine.map(p => ({
                                    x: (p.x / 100) * pitchWidth,
                                    y: (p.y / 100) * pitchHeight
                                }));

                                if (selectedLineType.lineStyle === 'dribble') {
                                    const isFreehand = selectedLineType.drawMode === 'freehand';
                                    const amplitude = isFreehand ? 10 : 6;
                                    const frequency = isFreehand ? 0.12 : 0.2;

                                    const wavePoints = [];
                                    let cumulativeDistance = 0;

                                    for (let i = 0; i < points.length - 1; i++) {
                                        const p1 = points[i];
                                        const p2 = points[i + 1];
                                        const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                                        const steps = Math.max(Math.floor(distance / 2), 15);

                                        for (let j = 0; j <= steps; j++) {
                                            const t = j / steps;
                                            const baseX = p1.x + (p2.x - p1.x) * t;
                                            const baseY = p1.y + (p2.y - p1.y) * t;

                                            const dx = p2.x - p1.x;
                                            const dy = p2.y - p1.y;
                                            const length = Math.sqrt(dx * dx + dy * dy);
                                            const perpX = -dy / length;
                                            const perpY = dx / length;

                                            const currentDistance = cumulativeDistance + (t * distance);
                                            const waveOffset = Math.sin(currentDistance * frequency * Math.PI) * amplitude;
                                            const x = baseX + perpX * waveOffset;
                                            const y = baseY + perpY * waveOffset;

                                            wavePoints.push({ x, y });
                                        }

                                        cumulativeDistance += distance;
                                    }

                                    let pathData = `M ${wavePoints[0].x} ${wavePoints[0].y}`;
                                    for (let i = 1; i < wavePoints.length - 1; i += 2) {
                                        const p1 = wavePoints[i];
                                        const p2 = wavePoints[Math.min(i + 1, wavePoints.length - 1)];
                                        pathData += ` Q ${p1.x} ${p1.y}, ${p2.x} ${p2.y}`;
                                    }
                                    if (wavePoints.length % 2 === 0) {
                                        const last = wavePoints[wavePoints.length - 1];
                                        pathData += ` L ${last.x} ${last.y}`;
                                    }

                                    return (
                                        <path
                                            d={pathData}
                                            fill="none"
                                            stroke="#000000"
                                            strokeWidth="3"
                                            markerEnd="url(#arrowhead-line)"
                                            opacity={0.7}
                                        />
                                    );
                                } else if (selectedLineType.drawMode === 'freehand') {
                                    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                    return (
                                        <path
                                            d={pathData}
                                            fill="none"
                                            stroke="#000000"
                                            strokeWidth="3"
                                            strokeDasharray={selectedLineType.lineStyle === 'dotted' ? '5,5' : 'none'}
                                            markerEnd="url(#arrowhead-line)"
                                            opacity={0.7}
                                        />
                                    );
                                } else {
                                    const start = points[0];
                                    const end = points[points.length - 1];
                                    return (
                                        <line
                                            x1={start.x}
                                            y1={start.y}
                                            x2={end.x}
                                            y2={end.y}
                                            stroke="#000000"
                                            strokeWidth="3"
                                            strokeDasharray={selectedLineType.lineStyle === 'dotted' ? '5,5' : 'none'}
                                            markerEnd="url(#arrowhead-line)"
                                            opacity={0.7}
                                        />
                                    );
                                }
                            })()
                        )}

                        {/* Render current shape being drawn */}
                        {isDrawingShape && currentShapeDimensions && drawingShapeType && currentShapeDimensions.width > 0 && currentShapeDimensions.height > 0 && (
                            (() => {
                                const x = (currentShapeDimensions.x / 100) * pitchWidth;
                                const y = (currentShapeDimensions.y / 100) * pitchHeight;
                                const width = (currentShapeDimensions.width / 100) * pitchWidth;
                                const height = (currentShapeDimensions.height / 100) * pitchHeight;

                                if (drawingShapeType.variant === 'rect' || drawingShapeType.variant === 'square') {
                                    return (
                                        <rect
                                            x={x}
                                            y={y}
                                            width={width}
                                            height={height}
                                            fill={drawingShapeType.shaded ? 'rgba(128, 128, 128, 0.3)' : 'none'}
                                            stroke={selectedColor}
                                            strokeWidth="3"
                                            strokeDasharray={drawingShapeType.dashed ? '5,5' : 'none'}
                                            opacity={0.7}
                                        />
                                    );
                                } else if (drawingShapeType.variant === 'circle') {
                                    const centerX = x + width / 2;
                                    const centerY = y + height / 2;
                                    const radiusX = width / 2;
                                    const radiusY = height / 2;
                                    return (
                                        <ellipse
                                            cx={centerX}
                                            cy={centerY}
                                            rx={radiusX}
                                            ry={radiusY}
                                            fill={drawingShapeType.shaded ? 'rgba(128, 128, 128, 0.3)' : 'none'}
                                            stroke={selectedColor}
                                            strokeWidth="3"
                                            strokeDasharray={drawingShapeType.dashed ? '5,5' : 'none'}
                                            opacity={0.7}
                                        />
                                    );
                                }
                                return null;
                            })()
                        )}
                    </svg>

                    {/* Touch Drag Preview (Mobile) */}
                    {draggedAsset && touchDragPos && (
                        <div
                            className="fixed pointer-events-none z-[200] opacity-90 transition-transform duration-75"
                            style={{
                                left: touchDragPos.x,
                                top: touchDragPos.y,
                                transform: 'translate(-50%, -50%) scale(1.1)'
                            }}
                        >
                            <div className="bg-slate-700/90 border-2 border-blue-500 rounded-xl p-2 w-20 h-20 flex items-center justify-center">
                                {draggedAsset.type === 'player' && (
                                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: selectedColor }}>
                                        {draggedAsset.isGK ? (
                                            <span className="text-white font-bold text-lg">G</span>
                                        ) : draggedAsset.isDefender ? (
                                            <span className="text-white font-bold text-lg">D</span>
                                        ) : (
                                            <User size={20} className="text-white" />
                                        )}
                                    </div>
                                )}
                                {draggedAsset.type === 'marker' && (
                                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: selectedColor }}>
                                        {draggedAsset.variant === 'x' && <X size={20} className="text-white" />}
                                    </div>
                                )}
                                {draggedAsset.type === 'icon' && <span className="text-xs">{draggedAsset.icon}</span>}
                                {draggedAsset.type === 'equipment' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {draggedAsset.variant === 'cone' && (
                                            <svg viewBox="0 0 64 64" className="w-10 h-12">
                                                {/* <!-- Base --> */}
                                                <polygon points="12,52 52,52 52,60 12,60" fill="#ff7a00" />

                                                {/* <!-- Cone body (25% taller) --> */}
                                                <polygon points="32,-6 48,52 16,52" fill="#ff8c1a" />

                                                {/* <!-- Highlight (scaled with height) --> */}
                                                <polygon points="32,-2 38,52 30,52" fill="#ffa64d" opacity="0.9" />
                                            </svg>
                                        )}
                                        {draggedAsset.variant === 'marker' && (
                                            <svg
                                                width="1em"
                                                height="1em"
                                                viewBox="0 0 64 64"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-10 h-10"
                                            >
                                                <circle cx="32" cy="32" r="20" fill={selectedColor} />
                                            </svg>
                                        )}
                                        {draggedAsset.variant === 'pole' && (
                                            <svg viewBox="0 0 64 64" className="w-10 h-10" fill={selectedColor}>
                                                {/* Ground base */}
                                                <rect x="26" y="50" width="12" height="4" rx="2" />
                                                {/* Pole */}
                                                <rect x="31" y="8" width="2" height="44" rx="2" />
                                            </svg>
                                        )}
                                        {draggedAsset.variant === 'hurdle' && (
                                            <div className="w-12 h-8 border-t-4 border-x-4 rounded-t-lg" style={{ borderColor: selectedColor }}></div>
                                        )}
                                        {draggedAsset.variant === '5sgoal' && (
                                            <svg viewBox="0 0 64 64" className="w-12 h-8" fill={selectedColor}>
                                                {/* Left post */}
                                                <rect x="14" y="22" width="3" height="20" rx="1.5" />
                                                {/* Right post */}
                                                <rect x="46" y="22" width="3" height="20" rx="1.5" />
                                                {/* Crossbar */}
                                                <rect x="14" y="22" width="35" height="3" rx="1.5" />
                                                {/* Net (horizontal lines) */}
                                                <rect x="14" y="27" width="35" height="0.8" opacity="0.6" />
                                                <rect x="14" y="31" width="35" height="0.8" opacity="0.6" />
                                                <rect x="14" y="35" width="35" height="0.8" opacity="0.6" />
                                                <rect x="14" y="39" width="35" height="0.8" opacity="0.6" />
                                                {/* Net (vertical hints) */}
                                                <rect x="22" y="25" width="0.8" height="14" opacity="0.5" />
                                                <rect x="32" y="25" width="0.8" height="14" opacity="0.5" />
                                                <rect x="40" y="25" width="0.8" height="14" opacity="0.5" />
                                            </svg>
                                        )}
                                        {draggedAsset.variant === 'minigoal' && (
                                            <div className="w-12 h-8 border-2" style={{ borderColor: selectedColor }}>
                                                <div className="w-full h-full border border-dashed border-current opacity-50"></div>
                                            </div>
                                        )}
                                        {draggedAsset.variant === 'ladder' && (
                                            <div className="w-12 h-6 flex border-y-2" style={{ borderColor: selectedColor }}>
                                                <div className="flex-1 border-r-2 border-current"></div>
                                                <div className="flex-1 border-r-2 border-current"></div>
                                                <div className="flex-1"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {draggedAsset.type === 'shape' && (
                                    <>
                                        {draggedAsset.variant === 'rect' && (
                                            <div
                                                className={`w-10 h-10 border-2 ${draggedAsset.dashed ? 'border-dashed' : ''}`}
                                                style={{
                                                    borderColor: selectedColor,
                                                    backgroundColor: draggedAsset.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                }}
                                            ></div>
                                        )}
                                        {draggedAsset.variant === 'square' && (
                                            <div
                                                className={`w-10 h-10 border-2 ${draggedAsset.dashed ? 'border-dashed' : ''}`}
                                                style={{
                                                    borderColor: selectedColor,
                                                    backgroundColor: draggedAsset.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                }}
                                            ></div>
                                        )}
                                        {draggedAsset.variant === 'circle' && (
                                            <div
                                                className={`w-10 h-10 border-2 rounded-full ${draggedAsset.dashed ? 'border-dashed' : ''}`}
                                                style={{
                                                    borderColor: selectedColor,
                                                    backgroundColor: draggedAsset.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                }}
                                            ></div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ========== BOTTOM TOOLBAR (35%) ========== */}
            {!isViewMode && (
                <footer className="h-[35vh] bg-[#18181b] border-t border-white/10 flex flex-col shrink-0">

                    {/* Color Picker */}
                    {!isViewMode && (
                        <div className="px-4 py-2 border-b border-white/10 bg-[#121212] flex justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 font-semibold uppercase">Color:</span>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedColor(c.value)}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                {/* Button to move selected item in the field */}
                                <button
                                    onClick={toggleMoveMode}
                                    className={`p-1 rounded transition-all ${moveMode
                                        ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 bg-blue-500/20'
                                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/10'
                                        }`}
                                    title={moveMode ? "Deactivate Move Mode" : "Activate Move Mode"}
                                >
                                    <Move className="h-6 w-6" />
                                </button>

                                {/* Button to delete selected item from the field */}
                                <button
                                    onClick={toggleDeleteMode}
                                    className={`p-1 rounded transition-all ${deleteMode
                                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 bg-red-500/20'
                                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/10'
                                        }`}
                                    title={deleteMode ? "Deactivate Delete Mode" : "Activate Delete Mode"}
                                >
                                    <Trash2Icon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 bg-[#121212]">
                        {(['players', 'equipment', 'shapes', 'arrows'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    // Clear drag state when switching tabs to prevent ghost previews
                                    setDraggedAsset(null);
                                    setTouchDragPos(null);
                                    // Clear line selection when switching away from arrows
                                    if (tab !== 'arrows') {
                                        setSelectedLineType(null);
                                    }
                                }}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500 bg-[#18181b]' : 'text-zinc-500'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                        <div className="grid grid-cols-3 gap-3 pb-4">
                            {(ASSETS[activeTab] as any[]).map((asset) => (
                                <div
                                    key={asset.id}
                                    draggable={asset.type !== 'line' && asset.type !== 'shape'}
                                    onDragStart={(e) => asset.type !== 'line' && asset.type !== 'shape' && handleDragStart(e, asset)}
                                    onTouchStart={(e) => asset.type !== 'line' && asset.type !== 'shape' && handleTouchStart(e, asset)}
                                    onClick={() => {
                                        if (asset.type === 'line') {
                                            setSelectedLineType(asset);
                                            setDrawingShapeType(null);
                                        } else if (asset.type === 'shape') {
                                            setDrawingShapeType(asset);
                                            setSelectedLineType(null);
                                            setMoveMode(false);
                                            setDeleteMode(false);
                                        }
                                    }}
                                    className={`bg-slate-700/50 border border-slate-600 rounded-xl p-2 h-28 flex flex-col items-center justify-center gap-1 active:bg-emerald-900/40 transition-colors ${asset.type === 'line' || asset.type === 'shape' ? 'cursor-pointer' : 'cursor-grab'
                                        } ${selectedLineType?.id === asset.id || drawingShapeType?.id === asset.id ? 'ring-2 ring-emerald-500 bg-emerald-900/40' : ''
                                        }`}
                                >
                                    {/* Player Preview */}
                                    {asset.type === 'player' && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: selectedColor }}>
                                            {asset.isGK ? (
                                                <span className="text-white font-bold text-sm">G</span>
                                            ) : asset.isDefender ? (
                                                <span className="text-white font-bold text-sm">D</span>
                                            ) : (
                                                <User size={14} className="text-white" />
                                            )}
                                        </div>
                                    )}

                                    {/* Marker Preview (X and Empty Circle) */}
                                    {asset.type === 'marker' && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{ backgroundColor: selectedColor }}>
                                            {asset.variant === 'x' && <X size={14} className="text-white" />}
                                        </div>
                                    )}

                                    {/* Icon Preview */}
                                    {asset.type === 'icon' && <span className="text-2xl">{asset.icon}</span>}

                                    {/* Equipment Previews */}
                                    {asset.type === 'equipment' && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {asset.variant === 'cone' && (
                                                <svg viewBox="0 0 64 64" className="w-8 h-8 drop-shadow-md">
                                                    {/* Base */}
                                                    <polygon points="12,52 52,52 52,60 12,60" fill="#ff7a00" />
                                                    {/* Cone body */}
                                                    <polygon points="32,6 48,52 16,52" fill="#ff8c1a" />
                                                    {/* Highlight */}
                                                    <polygon points="32,10 38,52 30,52" fill="#ffa64d" opacity="0.9" />
                                                </svg>
                                            )}
                                            {asset.variant === 'marker' && (
                                                <svg
                                                    width="1em"
                                                    height="1em"
                                                    viewBox="0 0 64 64"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-8 h-8"
                                                >
                                                    <circle cx="32" cy="32" r="20" fill={selectedColor} />
                                                </svg>
                                            )}
                                            {asset.variant === 'pole' && (
                                                <svg viewBox="0 0 64 64" className="w-fit h-fit" fill={selectedColor}>
                                                    {/* Ground base */}
                                                    <rect x="26" y="50" width="12" height="4" rx="2" />
                                                    {/* Pole */}
                                                    <rect x="31" y="8" width="2" height="44" rx="2" />
                                                </svg>
                                            )}
                                            {asset.variant === 'hurdle' && (
                                                <div className="w-10 h-6 border-t-4 border-x-4 rounded-t-lg" style={{ borderColor: selectedColor }}></div>
                                            )}
                                            {asset.variant === '5sgoal' && (
                                                <svg viewBox="0 0 64 64" className="w-fit h-fit" >
                                                    {/* Left post */}
                                                    <rect x="14" y="22" width="3" height="20" rx="1.5" />
                                                    {/* Right post */}
                                                    <rect x="46" y="22" width="3" height="20" rx="1.5" />
                                                    {/* Crossbar */}
                                                    <rect x="14" y="22" width="35" height="3" rx="1.5" />
                                                    {/* Net (horizontal lines) */}
                                                    <rect x="14" y="27" width="35" height="0.8" opacity="0.6" />
                                                    <rect x="14" y="31" width="35" height="0.8" opacity="0.6" />
                                                    <rect x="14" y="35" width="35" height="0.8" opacity="0.6" />
                                                    <rect x="14" y="39" width="35" height="0.8" opacity="0.6" />
                                                    {/* Net (vertical hints) */}
                                                    <rect x="22" y="25" width="0.8" height="14" opacity="0.5" />
                                                    <rect x="32" y="25" width="0.8" height="14" opacity="0.5" />
                                                    <rect x="40" y="25" width="0.8" height="14" opacity="0.5" />
                                                </svg>
                                            )}
                                            {asset.variant === 'minigoal' && (
                                                // <div className="w-10 h-6 border-2" style={{ borderColor: selectedColor }}>
                                                //     <div className="w-full h-full border border-dashed border-current opacity-50"></div>
                                                // </div>
                                                <svg
                                                    viewBox="0 0 256 256"
                                                    className="w-fit h-fit"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    {/* <!-- Left post --> */}
                                                    <rect x="24" y="88" width="12" height="96" rx="6" />

                                                    {/* <!-- Right post --> */}
                                                    <rect x="220" y="88" width="12" height="96" rx="6" />

                                                    {/* <!-- Crossbar --> */}
                                                    <rect x="24" y="88" width="208" height="12" rx="6" />

                                                    {/* <!-- Net (horizontal lines) --> */}
                                                    <rect x="24" y="108" width="208" height="3.2" opacity="0.6" />
                                                    <rect x="24" y="124" width="208" height="3.2" opacity="0.6" />
                                                    <rect x="24" y="140" width="208" height="3.2" opacity="0.6" />
                                                    <rect x="24" y="156" width="208" height="3.2" opacity="0.6" />
                                                    <rect x="24" y="172" width="208" height="3.2" opacity="0.6" />

                                                    {/* <!-- Net (vertical hints) --> */}
                                                    <rect x="64" y="100" width="3.2" height="84" opacity="0.5" />
                                                    <rect x="128" y="100" width="3.2" height="84" opacity="0.5" />
                                                    <rect x="192" y="100" width="3.2" height="84" opacity="0.5" />
                                                </svg>
                                            )}
                                            {asset.variant === 'ladder' && (
                                                <div className="w-10 h-4 flex border-y-2" style={{ borderColor: selectedColor }}>
                                                    <div className="flex-1 border-r-2 border-current"></div>
                                                    <div className="flex-1 border-r-2 border-current"></div>
                                                    <div className="flex-1"></div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Shape Previews */}
                                    {asset.type === 'shape' && (
                                        <>
                                            {asset.variant === 'rect' && (
                                                <div
                                                    className={`w-8 h-8 border-2 ${asset.dashed ? 'border-dashed' : ''}`}
                                                    style={{
                                                        borderColor: selectedColor,
                                                        backgroundColor: asset.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                    }}
                                                ></div>
                                            )}
                                            {asset.variant === 'square' && (
                                                <div
                                                    className={`w-8 h-8 border-2 ${asset.dashed ? 'border-dashed' : ''}`}
                                                    style={{
                                                        borderColor: selectedColor,
                                                        backgroundColor: asset.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                    }}
                                                ></div>
                                            )}
                                            {asset.variant === 'circle' && (
                                                <div
                                                    className={`w-8 h-8 border-2 rounded-full ${asset.dashed ? 'border-dashed' : ''}`}
                                                    style={{
                                                        borderColor: selectedColor,
                                                        backgroundColor: asset.shaded ? 'rgba(128, 128, 128, 0.3)' : 'transparent'
                                                    }}
                                                ></div>
                                            )}
                                        </>
                                    )}

                                    {/* Line Type Preview */}
                                    {asset.type === 'line' && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg width="60" height="30" className="overflow-visible">
                                                {asset.lineStyle === 'solid' && (
                                                    <line x1="5" y1="15" x2="55" y2="15" stroke="#000000" strokeWidth="2" markerEnd="url(#arrowhead-preview)" />
                                                )}
                                                {asset.lineStyle === 'dotted' && (
                                                    <line x1="5" y1="15" x2="55" y2="15" stroke="#000000" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrowhead-preview)" />
                                                )}
                                                {asset.lineStyle === 'dribble' && (
                                                    <path d="M5,15 Q10,10 15,15 T25,15 T35,15 T45,15 L55,15" fill="none" stroke="#000000" strokeWidth="2" markerEnd="url(#arrowhead-preview)" />
                                                )}
                                                <defs>
                                                    <marker id="arrowhead-preview" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                                        <polyline points="1,1 7,4 1,7" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </marker>
                                                </defs>
                                            </svg>
                                        </div>
                                    )}

                                    <span className="text-[10px] font-medium text-slate-300 z-10">
                                        {asset.label}
                                        </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default DrillDesignerPage;
