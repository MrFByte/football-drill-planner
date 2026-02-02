import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Trash2,
    User,
    X,
    ChevronRight,
    ChevronLeft,
    Save,
    ArrowLeft,
    ArrowUpRight,
    RotateCw,
    RefreshCcw,
    Undo
} from 'lucide-react';
import { useDrill } from '@/context/DrillContext';

interface PitchElement {
    instanceId: number;
    id: string;
    type: 'player' | 'icon' | 'shape' | 'equipment';
    x: number;
    y: number;
    width?: number; // Percentage relative to container width
    height?: number; // Percentage relative to container height (or aspect ratio)
    rotation?: number; // Degrees
    color?: string;
    label?: string;
    isGK?: boolean;
    icon?: string;
    variant?: string;
    dashed?: boolean;
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
        { id: 'player', type: 'player', label: 'Player', width: 5, height: 4 },
        { id: 'gk', type: 'player', label: 'GK', isGK: true, width: 5, height: 4 },
    ],
    equipment: [
        { id: 'ball', type: 'icon', icon: '⚽', label: 'Ball', fixedColor: true, width: 4, height: 4 },
        { id: 'cone', type: 'equipment', variant: 'cone', label: 'Cone', width: 4, height: 4 },
        { id: 'marker', type: 'equipment', variant: 'marker', label: 'Marker', width: 4, height: 4 },
        { id: 'pole', type: 'equipment', variant: 'pole', label: 'Pole', width: 2, height: 4 },
        { id: 'hurdle', type: 'equipment', variant: 'hurdle', label: 'Hurdle', width: 6, height: 4 },
        { id: 'minigoal', type: 'equipment', variant: 'minigoal', label: 'Goal', width: 10, height: 6 },
        { id: 'ladder', type: 'equipment', variant: 'ladder', label: 'Ladder', width: 15, height: 5 },
    ],
    shapes: [
        { id: 'arrow', type: 'shape', variant: 'arrow', label: 'Arrow', width: 10, height: 10 },
        { id: 'arrow-dash', type: 'shape', variant: 'arrow', label: 'Arr Dot', width: 10, height: 10, dashed: true },
        { id: 'square', type: 'shape', variant: 'square', label: 'Square', width: 10, height: 10 },
        { id: 'square-dash', type: 'shape', variant: 'square', label: 'Sq Dot', width: 10, height: 10, dashed: true },
        { id: 'circle', type: 'shape', variant: 'circle', label: 'Circle', width: 10, height: 10 },
        { id: 'circle-dash', type: 'shape', variant: 'circle', label: 'Cir Dot', width: 10, height: 10, dashed: true },
        { id: 'rect', type: 'shape', variant: 'rect', label: 'Rect', width: 15, height: 8 },
        { id: 'rect-dash', type: 'shape', variant: 'rect', label: 'Rec Dot', width: 15, height: 8, dashed: true },
        { id: 'cross', type: 'shape', variant: 'cross', label: 'X', width: 8, height: 8 },
    ]
};

// FIFA Standard Dimensions in meters
const FIFA_DIMENSIONS = {
    '7v7': { width: 55, height: 37 },
    '11v11': { width: 105, height: 68 }
}

// Helper function to get field dimensions
const getFieldDimensions = (step: any) => {
    if (!step) return { width: 105, height: 68, unit: 'meter' }

    if (step.fieldMeasurement === 'custom') {
        return {
            width: step.width || 105,
            height: step.height || 68,
            unit: step.unit || 'meter'
        }
    }

    // Default: use FIFA dimensions
    const fieldType: '7v7' | '11v11' = step.fieldType || '11v11'
    const dimensions = FIFA_DIMENSIONS[fieldType]
    return {
        width: dimensions.width,
        height: dimensions.height,
        unit: 'meter' as 'meter' | 'yard'
    }
}

const DrillDesignerPage = () => {
    const navigate = useNavigate();
    const { stepId } = useParams<{ stepId: string }>();
    const { currentDrill, updateStep } = useDrill();
    const currentStep = currentDrill?.steps.find(step => step.id === stepId);

    const [elements, setElements] = useState<PitchElement[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'players' | 'equipment' | 'shapes'>('players');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

    // Drawing State
    const [isDrawingMode] = useState(false);
    const [paths, setPaths] = useState<DrawingPath[]>([]);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
    const [drawingColor] = useState('#ffffff');
    const [isDashed] = useState(false);

    const pitchRef = useRef<HTMLDivElement>(null);

    // Load existing elements
    useEffect(() => {
        if (currentStep?.canvasData?.elements) {
            setElements(currentStep.canvasData.elements);
        }
    }, [currentStep]);

    // Deselect on background click
    useEffect(() => {
        const handleBackgroundClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // If clicking on the pitch container itself (not an element)
            if (target.dataset.pitchBackground) {
                setSelectedId(null);
            }
        };
        window.addEventListener('mousedown', handleBackgroundClick);
        return () => window.removeEventListener('mousedown', handleBackgroundClick);
    }, []);

    const handleSave = () => {
        if (stepId) {
            updateStep(stepId, { canvasData: { elements, paths } });
            alert('Saved!');
            navigate('/drill-steps');
        }
    };

    // Load paths if they exist
    useEffect(() => {
        if (currentStep?.canvasData?.paths) {
            // Assuming canvasData type includes paths now, if not we might need to cast or update type def elsewhere.
            setPaths(currentStep.canvasData.paths);
        }
    }, [currentStep]);

    // Handle adding elements via click/drag
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
            width: asset.width || 5, // Default width %
            height: asset.height || 5, // Default height %
            rotation: 0
        };

        setElements((prev) => [...prev, newElement]);
        setSelectedId(newElement.instanceId); // Auto-select new
    };

    const handleDragStart = (e: React.DragEvent, asset: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        try {
            const assetData = e.dataTransfer.getData('application/json');
            if (assetData) {
                const asset = JSON.parse(assetData);
                addElementToPitch(asset, e.clientX, e.clientY);
            }
        } catch (err) {
            console.error("Failed to parse dropped asset", err);
        }
    };

    const handleReset = (instanceId: number, e: any) => {
        e.preventDefault();
        e.stopPropagation();

        const element = elements.find(el => el.instanceId === instanceId);
        if (!element) return;

        // Find original asset defaults
        let originalAsset: any = null;
        Object.values(ASSETS).forEach(list => {
            const found = list.find(a => a.id === element.id || (a.type === element.type && (a as any).variant === element.variant));
            if (found) originalAsset = found;
        });

        if (originalAsset) {
            setElements(prev => prev.map(el =>
                el.instanceId === instanceId
                    ? {
                        ...el,
                        width: originalAsset.width || 5,
                        height: originalAsset.height || 5,
                        rotation: 0
                    }
                    : el
            ));
        }
    };

    // Drawing Handlers
    const handleDrawStart = (e: any) => {
        if (!isDrawingMode || !pitchRef.current) return;
        e.preventDefault();
        e.stopPropagation(); // Stop from dragging pitch/elements

        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setCurrentPath([{ x, y }]);
    };

    const handleDrawMove = (e: any) => {
        if (!isDrawingMode || currentPath.length === 0 || !pitchRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = pitchRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setCurrentPath(prev => [...prev, { x, y }]);
    };

    const handleDrawEnd = () => {
        if (!isDrawingMode || currentPath.length === 0) return;

        const newPath: DrawingPath = {
            id: Date.now(),
            points: currentPath,
            color: drawingColor,
            dashed: isDashed
        };

        setPaths(prev => [...prev, newPath]);
        setCurrentPath([]);
    };

    // Interaction Handlers
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

    const handleResize = (instanceId: number, e: any, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!pitchRef.current) return;
        const rect = pitchRef.current.getBoundingClientRect();
        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const startY = e.touches ? e.touches[0].clientY : e.clientY;

        // Capture initial state
        const element = elements.find(el => el.instanceId === instanceId);
        if (!element) return;

        const initialWidth = element.width || 5;
        const initialHeight = element.height || 5;
        // Max limits (30% relative to pitch container)
        const MAX_WIDTH = 30;
        const MAX_HEIGHT = 30;

        const handleMove = (moveEvent: any) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const deltaXPercent = ((currentX - startX) / rect.width) * 100;
            const deltaYPercent = ((currentY - startY) / rect.height) * 100;

            setElements(prev => prev.map(el => {
                if (el.instanceId !== instanceId) return el;

                let newWidth = initialWidth;
                let newHeight = initialHeight;

                if (direction.includes('e')) newWidth += deltaXPercent;
                if (direction.includes('s')) newHeight += deltaYPercent;

                // Apply constraints
                const clampedWidth = Math.max(2, Math.min(newWidth, MAX_WIDTH));
                const clampedHeight = Math.max(2, Math.min(newHeight, MAX_HEIGHT));

                return {
                    ...el,
                    width: clampedWidth,
                    height: clampedHeight
                };
            }));
        };

        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);
    };

    const handleRotate = (instanceId: number, e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!pitchRef.current) return;
        const rect = pitchRef.current.getBoundingClientRect();

        // Find center of element
        const element = elements.find(el => el.instanceId === instanceId);
        if (!element) return;

        const centerX = rect.left + (element.x / 100) * rect.width;
        const centerY = rect.top + (element.y / 100) * rect.height;

        const handleMove = (moveEvent: any) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const radians = Math.atan2(currentY - centerY, currentX - centerX);
            const degrees = radians * (180 / Math.PI);
            // Offset by 90 degrees because initial handle is at top (-90 deg from standard math 0 at right)
            const adjustedDegrees = degrees + 90;

            setElements(prev => prev.map(el =>
                el.instanceId === instanceId ? { ...el, rotation: adjustedDegrees } : el
            ));
        };

        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);
    };

    const removeElement = (instanceId: number) => {
        setElements(prev => prev.filter(el => el.instanceId !== instanceId));
        if (selectedId === instanceId) setSelectedId(null);
    };

    if (!currentStep) return <div>Loading...</div>;

    return (
        <div className="flex h-screen w-screen bg-slate-900 overflow-hidden font-sans text-slate-100 select-none touch-none">

            {/* Sidebar Trigger */}
            <div className={`fixed left-0 top-0 bottom-0 z-[200] flex items-center transition-all duration-300 ${isSidebarOpen ? 'translate-x-[340px]' : 'translate-x-0'}`}>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="bg-emerald-600 p-3 rounded-r-2xl shadow-xl border-y border-r border-emerald-400/30 flex items-center justify-center active:scale-95 transition-transform"
                >
                    {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                </button>
            </div>

            {/* Slide-out Tool Menu */}
            <aside className={`fixed left-0 top-0 bottom-0 w-[340px] bg-slate-800 border-r border-slate-700 z-[200] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0">
                    <h2 className="font-bold text-lg text-emerald-400 uppercase tracking-wider">Drill Tools</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-700 rounded"><X size={20} /></button>
                </div>

                {/* Color Picker */}
                <div className="p-4 border-b border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Select Color</h3>
                    <div className="flex gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedColor(c.value)}
                                className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${selectedColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex bg-slate-900 p-1 m-2 rounded-lg">
                    {['players', 'equipment', 'shapes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start">
                    {(ASSETS[activeTab] as any[]).map((asset) => (
                        <div
                            key={asset.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset)}
                            onClick={() => addElementToPitch(asset, window.innerWidth / 2, window.innerHeight / 2)}
                            className="bg-slate-700/50 border border-slate-600 rounded-xl p-2 h-24 flex flex-col items-center justify-center gap-2 active:bg-emerald-900/40 cursor-grab transition-colors relative overflow-hidden group"
                        >
                            {asset.type === 'player' && (
                                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-colors duration-300" style={{ backgroundColor: selectedColor }}>
                                    <User size={14} className="text-white" />
                                </div>
                            )}
                            {asset.type === 'icon' && <span className="text-3xl" style={{ color: asset.fixedColor ? undefined : selectedColor }}>{asset.icon}</span>}

                            {/* Render Equipment Previews */}
                            {asset.type === 'equipment' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    {asset.variant === 'cone' && (
                                        <svg viewBox="0 0 24 24" className="w-8 h-8 drop-shadow-md" style={{ fill: selectedColor }}>
                                            <path d="M12 2 L2 22 L22 22 Z" />
                                        </svg>
                                    )}
                                    {asset.variant === 'marker' && (
                                        <div className="w-8 h-8 rounded-full shadow-md border-2 border-black/10" style={{ backgroundColor: selectedColor }}></div>
                                    )}
                                    {asset.variant === 'pole' && (
                                        <div className="flex flex-col items-center">
                                            <div className="w-1 h-8 bg-slate-200"></div>
                                            <div className="w-4 h-4 rounded-full -mt-2 shadow-sm" style={{ backgroundColor: selectedColor }}></div>
                                        </div>
                                    )}
                                    {asset.variant === 'hurdle' && (
                                        <div className="w-10 h-6 border-t-4 border-x-4 rounded-t-lg border-slate-200" style={{ borderColor: selectedColor }}></div>
                                    )}
                                    {asset.variant === 'minigoal' && (
                                        <div className="w-10 h-6 border-2 relative" style={{ borderColor: selectedColor }}>
                                            <div className="absolute inset-0 opacity-20 bg-current"></div>
                                            <div className="w-full h-full border border-dashed border-current opacity-50" style={{ backgroundImage: `linear-gradient(45deg, ${selectedColor} 25%, transparent 25%), linear-gradient(-45deg, ${selectedColor} 25%, transparent 25%)`, backgroundSize: '4px 4px' }}></div>
                                        </div>
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

                            {asset.type === 'shape' && asset.variant === 'cross' && (
                                <X size={32} strokeWidth={4} style={{ color: selectedColor }} />
                            )}
                            {asset.type === 'shape' && asset.variant === 'arrow' && (
                                <ArrowUpRight size={32} strokeWidth={2} style={{ color: selectedColor }} />
                            )}
                            {asset.type === 'shape' && asset.variant === 'zone' && (
                                <div className="w-8 h-6 border-2 border-dashed rounded-md" style={{ borderColor: selectedColor }}></div>
                            )}
                            {asset.type === 'shape' && asset.variant === 'rect' && (
                                <div className="w-8 h-8 border-2" style={{ borderColor: selectedColor }}></div>
                            )}
                            {asset.type === 'shape' && asset.variant === 'square' && (
                                <div className={`w-8 h-8 border-2 ${asset.dashed ? 'border-dashed' : ''}`} style={{ borderColor: selectedColor }}></div>
                            )}
                            {asset.type === 'shape' && asset.variant === 'circle' && (
                                <div className={`w-8 h-8 border-2 rounded-full ${asset.dashed ? 'border-dashed' : ''}`} style={{ borderColor: selectedColor }}></div>
                            )}
                            <span className="text-[10px] font-medium text-slate-300 z-10">{asset.label}</span>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                    <button
                        onClick={() => setElements([])}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                    >
                        <Trash2 size={16} />
                        <span className="text-sm font-bold">Clear Pitch</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area - Header + Field stacked vertically */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="w-full h-[10%] min-h-[60px] bg-[#18181b] border-b border-white/10 flex items-center justify-between px-6 z-30 relative">

                    {/* Left: Back Button - Fixed to left edge */}
                    <div className="flex-1 flex justify-start">
                        <button
                            onClick={() => navigate('/drill-steps')}
                            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                            title="Back to Steps"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    {/* Center: Clear All and Undo - Absolutely centered */}
                    <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
                        <button
                            onClick={() => {
                                setElements([])
                                setPaths([])
                            }}
                            className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors border border-white/10"
                            title="Clear All"
                        >
                            <Trash2 size={18} />
                            <span className="text-sm font-medium">Clear All</span>
                        </button>
                        <button
                            onClick={() => {
                                // Undo last action - remove last element or path
                                if (paths.length > 0) {
                                    setPaths(prev => prev.slice(0, -1))
                                } else if (elements.length > 0) {
                                    setElements(prev => prev.slice(0, -1))
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors border border-white/10"
                            title="Undo"
                        >
                            <Undo size={18} />
                            <span className="text-sm font-medium">Undo</span>
                        </button>
                    </div>

                    {/* Right: Save Button - Fixed to right edge */}
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            title="Save"
                        >
                            <Save size={20} />
                            <span>Save</span>
                        </button>
                    </div>
                </header>

                {/* Main Pitch View - Mobile Friendly Vertical Layout */}
                <main className="flex-1 relative bg-[#18181b] overflow-auto flex flex-col">
                    {/* Dimension Label at Top */}
                    {currentStep && (() => {
                        const dims = getFieldDimensions(currentStep)
                        const unitLabel = dims.unit === 'yard' ? 'yards' : 'meters'
                        return (
                            <div className="text-center py-2 text-white text-sm font-medium bg-[#18181b] border-b border-white/10">
                                {dims.width} {unitLabel}
                            </div>
                        )
                    })()}

                    {/* Field Container - Centered Vertically, Full Width */}
                    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[#1a3a1a]">
                        {/* Dimension Label - Left (Vertical) */}
                        {currentStep && (() => {
                            const dims = getFieldDimensions(currentStep)
                            const unitLabel = dims.unit === 'yard' ? 'yards' : 'meters'
                            return (
                                <div className="flex items-center justify-center px-2 md:px-4">
                                    <div
                                        className="text-white text-xs md:text-sm font-medium whitespace-nowrap"
                                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                    >
                                        {dims.height} {unitLabel}
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Pitch Lines Wrapper - Responsive sizing */}
                        <div
                            ref={pitchRef}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            data-pitch-background="true"
                            className="relative w-full max-w-md md:max-w-lg lg:max-w-2xl aspect-[2/3] border-4 border-white/40 flex flex-col pointer-events-auto"
                            style={{
                                clipPath: currentStep?.groundType === 'half' ? 'inset(50% 0 0 0)' : 'none'
                            }}
                        >
                            {/* Horizontal Grass Stripes - 8 stripes total (4 per half) - Enhanced colors */}
                            <div className="absolute inset-0 flex flex-col pointer-events-none">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 ${i % 2 === 0 ? 'bg-[#2d5a27]' : 'bg-[#3a7535]'}`}
                                    />
                                ))}
                            </div>

                            {/* Top Goal Area (6-yard box) - Hidden when half field */}
                            {currentStep?.groundType !== 'half' && currentStep && (() => {
                                const fieldType = currentStep.fieldType || '11v11'
                                const is7v7 = fieldType === '7v7'

                                // 11v11: 6yd box = 20yd wide × 6yd deep, 18yd box = 44yd wide × 18yd deep
                                // 7v7: Goal box = 8yd wide × 4yd deep, Penalty box = 24yd wide × 12yd deep
                                const goalBoxWidth = is7v7 ? '13.33%' : '17.39%'  // 7v7: 8/60, 11v11: 20/115
                                const goalBoxHeight = is7v7 ? '6.67%' : '5.22%'   // 7v7: 4/60, 11v11: 6/115
                                const penaltyBoxWidthRatio = is7v7 ? 3 : 2.53      // 24/8=3, 44/20=2.2
                                const penaltyBoxHeightRatio = is7v7 ? 3 : 3.45     // 12/4=3, 18/6=3
                                const penaltySpotPos = is7v7 ? '250%' : '230%'     // 7v7: 10yd from 4yd line, 11v11: 12yd from 6yd line
                                const penaltyArcWidth = is7v7 ? '133%' : '88%'     // Arc width relative to goal box
                                const penaltyArcHeight = is7v7 ? '133%' : '155%'   // Arc height

                                return (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 border-b-4 border-x-4 border-white/40 pointer-events-none" style={{ width: goalBoxWidth, height: goalBoxHeight }}>
                                        {/* 18-yard box / Penalty Area */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 border-b-4 border-x-4 border-white/40 pointer-events-none" style={{ width: `${penaltyBoxWidthRatio * 100}%`, height: `${penaltyBoxHeightRatio * 100}%` }}>
                                            {/* Penalty Spot - on the 18-yard line */}
                                            <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" style={{ top: penaltySpotPos }}></div>
                                            {/* Penalty Arc - from penalty spot */}
                                            <div className="absolute left-1/2 -translate-x-1/2 border-b-4 border-white/40 rounded-b-full pointer-events-none" style={{ top: penaltySpotPos, width: penaltyArcWidth, height: penaltyArcHeight, transform: 'translate(-50%, -50%)' }}></div>
                                        </div>
                                        {/* Physical Goal Post - Enhanced */}
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[86.67%] h-3 bg-white rounded-full shadow-lg border-2 border-white/40"></div>
                                    </div>
                                )
                            })()}

                            {/* Center Circle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/40 rounded-full flex items-center justify-center pointer-events-none">
                                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                            </div>
                            {/* Center Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 -translate-y-1/2 pointer-events-none"></div>

                            {/* Bottom Goal Area (6-yard box) */}
                            {currentStep && (() => {
                                const fieldType = currentStep.fieldType || '11v11'
                                const is7v7 = fieldType === '7v7'

                                const goalBoxWidth = is7v7 ? '13.33%' : '17.39%'
                                const goalBoxHeight = is7v7 ? '6.67%' : '5.22%'
                                const penaltyBoxWidthRatio = is7v7 ? 3 : 2.53
                                const penaltyBoxHeightRatio = is7v7 ? 3 : 3.45
                                const penaltySpotPos = is7v7 ? '250%' : '230%'
                                const penaltyArcWidth = is7v7 ? '133%' : '88%'
                                const penaltyArcHeight = is7v7 ? '133%' : '155%'

                                return (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t-4 border-x-4 border-white/40 pointer-events-none" style={{ width: goalBoxWidth, height: goalBoxHeight }}>
                                        {/* 18-yard box / Penalty Area */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t-4 border-x-4 border-white/40 pointer-events-none" style={{ width: `${penaltyBoxWidthRatio * 100}%`, height: `${penaltyBoxHeightRatio * 100}%` }}>
                                            {/* Penalty Spot - on the 18-yard line */}
                                            <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" style={{ bottom: penaltySpotPos }}></div>
                                            {/* Penalty Arc - from penalty spot */}
                                            <div className="absolute left-1/2 -translate-x-1/2 border-t-4 border-white/40 rounded-t-full pointer-events-none" style={{ bottom: penaltySpotPos, width: penaltyArcWidth, height: penaltyArcHeight, transform: 'translate(-50%, 50%)' }}></div>
                                        </div>
                                        {/* Physical Goal Post - Enhanced */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[86.67%] h-3 bg-white rounded-full shadow-lg border-2 border-white/40"></div>
                                    </div>
                                )
                            })()}

                            {/* Corner Arcs - Top corners hidden when half field */}
                            {currentStep?.groundType !== 'half' && (
                                <>
                                    <div className="absolute top-0 left-0 w-4 h-4 border-r-4 border-b-4 border-white/40 rounded-br-full pointer-events-none"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-l-4 border-b-4 border-white/40 rounded-bl-full pointer-events-none"></div>
                                </>
                            )}
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-r-4 border-t-4 border-white/40 rounded-tr-full pointer-events-none"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-l-4 border-t-4 border-white/40 rounded-tl-full pointer-events-none"></div>

                            {/* Drawing Overlay (High Z-Index) */}
                            <div className="absolute inset-0 z-[160] pointer-events-none">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {paths.map(path => (
                                        <polyline
                                            key={path.id}
                                            points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="none"
                                            stroke={path.color}
                                            strokeWidth="0.5"
                                            strokeDasharray={path.dashed ? "1,1" : "none"}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ))}
                                    {currentPath.length > 0 && (
                                        <polyline
                                            points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="none"
                                            stroke={drawingColor}
                                            strokeWidth="0.5"
                                            strokeDasharray={isDashed ? "1,1" : "none"}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                </svg>
                            </div>

                            {/* Drawing Interaction Layer (Active only in Drawing Mode) */}
                            {isDrawingMode && (
                                <div
                                    className="absolute inset-0 z-[170] cursor-crosshair touch-none"
                                    onMouseDown={handleDrawStart}
                                    onMouseMove={handleDrawMove}
                                    onMouseUp={handleDrawEnd}
                                    onMouseLeave={handleDrawEnd}
                                    onTouchStart={handleDrawStart}
                                    onTouchMove={handleDrawMove}
                                    onTouchEnd={handleDrawEnd}
                                />
                            )}

                            {/* Draggable Elements Layer */}
                            <div className="absolute inset-0 pointer-events-none">
                                {elements.map((el) => {
                                    const isSelected = selectedId === el.instanceId;
                                    return (
                                        <div
                                            key={el.instanceId}
                                            style={{
                                                left: `${el.x}%`,
                                                top: `${el.y}%`,
                                                width: `${el.width}%`,
                                                height: `${el.height}%`, // Use height % relative to width approach if simplified, but here using absolute %
                                                transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                                                zIndex: isSelected ? 150 : 100
                                            }}
                                            className={`absolute group touch-none pointer-events-auto flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black/50' : ''}`}
                                            onTouchMove={(e) => handleElementDrag(el.instanceId, e)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(el.instanceId); }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedId(el.instanceId);
                                                const moveHandler = (moveEvent: MouseEvent) => handleElementDrag(el.instanceId, moveEvent);
                                                const upHandler = () => {
                                                    window.removeEventListener('mousemove', moveHandler);
                                                    window.removeEventListener('mouseup', upHandler);
                                                };
                                                window.addEventListener('mousemove', moveHandler);
                                                window.addEventListener('mouseup', upHandler);
                                            }}
                                        >
                                            {/* Transformation Handles (Only when selected) */}
                                            {isSelected && (
                                                <>
                                                    {/* Reset Handle */}
                                                    <div
                                                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer z-50 hover:bg-slate-600 active:scale-95 transition-all"
                                                        onMouseDown={(e) => handleReset(el.instanceId, e)}
                                                        onTouchStart={(e) => handleReset(el.instanceId, e)}
                                                        title="Reset"
                                                    >
                                                        <RefreshCcw size={12} />
                                                    </div>

                                                    {/* Rotate Handle */}
                                                    <div
                                                        className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full text-black flex items-center justify-center shadow-lg cursor-ew-resize z-50"
                                                        onMouseDown={(e) => handleRotate(el.instanceId, e)}
                                                        onTouchStart={(e) => handleRotate(el.instanceId, e)}
                                                    >
                                                        <RotateCw size={12} />
                                                    </div>

                                                    {/* Resize Handle (Bottom Right) */}
                                                    {el.type === 'shape' && (
                                                        <div
                                                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full shadow-lg cursor-nwse-resize z-50"
                                                            onMouseDown={(e) => handleResize(el.instanceId, e, 'se')}
                                                            onTouchStart={(e) => handleResize(el.instanceId, e, 'se')}
                                                        />
                                                    )}

                                                    {/* Delete Handle - Mobile Friendly */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeElement(el.instanceId); }}
                                                        className="absolute -top-6 -right-6 bg-red-500 rounded-full p-2 text-white shadow-xl z-50 hover:bg-red-600 active:scale-95 transition-transform"
                                                        title="Delete"
                                                    >
                                                        <X size={14} className="text-white" />
                                                    </button>
                                                </>
                                            )}



                                            {/* Element Renderers */}
                                            {el.type === 'player' && (
                                                <div
                                                    className={`w-full h-full rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-transform ${el.isGK ? 'animate-pulse' : ''}`}
                                                    style={{ backgroundColor: el.color }}
                                                >
                                                    <User size={18} className="text-white" />
                                                </div>
                                            )}

                                            {el.type === 'icon' && (
                                                <div className="relative w-full h-full flex items-center justify-center text-3xl drop-shadow-lg" style={{ color: el.color }}>
                                                    {el.icon}
                                                </div>
                                            )}

                                            {/* Render Equipment */}
                                            {el.type === 'equipment' && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {el.variant === 'cone' && (
                                                        <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-xl filter" style={{ fill: el.color || 'white' }}>
                                                            <path d="M12 2 L2 22 L22 22 Z" />
                                                        </svg>
                                                    )}
                                                    {el.variant === 'marker' && (
                                                        <div className="w-full h-full rounded-full shadow-md border-2 border-black/20" style={{ backgroundColor: el.color || 'white' }}></div>
                                                    )}
                                                    {el.variant === 'pole' && (
                                                        <div className="w-full h-full flex flex-col items-center justify-end relative">
                                                            <div className="w-[10%] h-full bg-white/90 absolute top-0 shadow-sm"></div>
                                                            <div className="w-full h-[20%] rounded-full shadow-lg z-10" style={{ backgroundColor: el.color || 'white' }}></div>
                                                        </div>
                                                    )}
                                                    {el.variant === 'hurdle' && (
                                                        <div className="w-full h-full border-t-[6px] border-x-[6px] rounded-t-xl" style={{ borderColor: el.color || 'white' }}></div>
                                                    )}
                                                    {el.variant === 'minigoal' && (
                                                        <div className="w-full h-full border-4 relative bg-black/10 shadow-inner" style={{ borderColor: el.color || 'white' }}>
                                                            {/* Net pattern */}
                                                            <div className="absolute inset-0 opacity-30"
                                                                style={{
                                                                    backgroundImage: `repeating-linear-gradient(45deg, ${el.color} 0, ${el.color} 1px, transparent 0, transparent 50%)`,
                                                                    backgroundSize: '10px 10px'
                                                                }}>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {el.variant === 'ladder' && (
                                                        <div className="w-full h-full flex flex-col items-center">
                                                            <div className="w-full h-full border-y-[3px] flex" style={{ borderColor: el.color || 'white' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className="flex-1 border-r-[3px] last:border-r-0" style={{ borderColor: el.color || 'white' }}></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Render Shapes */}
                                            {el.type === 'shape' && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {/* Squares / Rects / Circles */}
                                                    {(el.variant === 'rect' || el.variant === 'square' || el.variant === 'circle' || el.variant === 'zone') && (
                                                        <div
                                                            className={`w-full h-full border-4 ${el.dashed ? 'border-dashed' : ''} ${el.variant === 'circle' ? 'rounded-full' : ''}`}
                                                            style={{ borderColor: el.color || 'white' }}
                                                        />
                                                    )}

                                                    {/* Arrows */}
                                                    {el.variant === 'arrow' && (
                                                        <div className="w-full h-full flex items-center justify-center" style={{ color: el.color || 'white' }}>
                                                            <ArrowUpRight className="w-full h-full" strokeWidth={el.dashed ? 1 : 3} strokeDasharray={el.dashed ? "4 4" : ""} />
                                                        </div>
                                                    )}

                                                    {/* Cross */}
                                                    {el.variant === 'cross' && (
                                                        <div className="w-full h-full flex items-center justify-center" style={{ color: el.color || 'white' }}>
                                                            <X className="w-full h-full" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Info Overlay */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none mt-12">
                            <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                {elements.filter(e => e.type === 'player').length} PLAYERS
                            </div>
                        </div>

                        {/* Instruction (Mobile) */}
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-2xl text-[10px] text-white/80 border border-white/10 animate-pulse md:hidden pointer-events-none">
                            Tap Arrow to open tools
                        </div>
                    </div>

                    {/* Dimension Label - Right (Vertical) */}
                    {currentStep && (() => {
                        const dims = getFieldDimensions(currentStep)
                        const unitLabel = dims.unit === 'yard' ? 'yards' : 'meters'
                        return (
                            <div className="flex items-center justify-center px-2 md:px-4">
                                <div
                                    className="text-white text-xs md:text-sm font-medium whitespace-nowrap"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                >
                                    {dims.height} {unitLabel}
                                </div>
                            </div>
                        )
                    })()}
                    {/* Field Type Label at Bottom */}
                    {currentStep && (
                        <div className="text-center py-2 text-white text-sm font-medium bg-[#18181b] border-t border-white/10">
                            {currentStep.fieldType || '11v11'} field
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
};

export default DrillDesignerPage;
