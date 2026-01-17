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
    Pencil,
    Eraser,
    Undo,
    Minus,
    MoreHorizontal
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
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [paths, setPaths] = useState<DrawingPath[]>([]);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
    const [drawingColor, setDrawingColor] = useState('#ffffff');
    const [isDashed, setIsDashed] = useState(false);

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
            // Save paths as well? For now just elements, unless we extend the schema.
            // Ideally we'd save paths to canvasData too.
            updateStep(stepId, { canvasData: { elements, paths } });
            alert('Saved!');
        }
        if (stepId) {
            // Save paths as well? For now just elements, unless we extend the schema.
            // Ideally we'd save paths to canvasData too.
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

            {/* Main Pitch View */}
            <main className="flex-1 relative bg-[#2d5a27] overflow-auto">
                {/* Navigation Back */}
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => navigate('/drill-steps')}
                        className="bg-black/40 p-2 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>



                {/* Pitch Lines Wrapper */}
                <div
                    ref={pitchRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    data-pitch-background="true"
                    className="relative w-full min-h-[800px] border-4 border-white/40 m-auto flex flex-col pointer-events-auto"
                >
                    {/* Grass Pattern */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-auto"
                        data-pitch-background="true"
                        style={{ background: 'repeating-linear-gradient(90deg, #000, #000 10%, transparent 10%, transparent 20%)' }}></div>
                    {/* Top Goal Area */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-b-4 border-x-4 border-white/40 rounded-b-sm pointer-events-none">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-b-4 border-x-4 border-white/40"></div>
                        {/* Physical Goal Post */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[60%] h-2 bg-white/80 rounded-full shadow-lg"></div>
                    </div>

                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/40 rounded-full flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 -translate-y-1/2 pointer-events-none"></div>

                    {/* Bottom Goal Area */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-t-4 border-x-4 border-white/40 rounded-t-sm pointer-events-none">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-t-4 border-x-4 border-white/40"></div>
                        {/* Physical Goal Post */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[60%] h-2 bg-white/80 rounded-full shadow-lg"></div>
                    </div>

                    {/* Corner Arcs */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-r-4 border-b-4 border-white/40 rounded-br-full pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-l-4 border-b-4 border-white/40 rounded-bl-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-r-4 border-t-4 border-white/40 rounded-tr-full pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-l-4 border-t-4 border-white/40 rounded-tl-full pointer-events-none"></div>

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
            </main>

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-[200]">
                {/* Drawing Toolbar */}
                {isDrawingMode && (
                    <div className="bg-slate-800/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 mb-2">
                        {/* Colors */}
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setDrawingColor(c.value)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${drawingColor === c.value ? 'border-white scale-125' : 'border-transparent'}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                        {/* Tools */}
                        <div className="flex justify-between items-center border-t border-white/10 pt-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsDashed(false)}
                                    className={`p-2 rounded-lg ${!isDashed ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/10'}`}
                                    title="Solid Line"
                                >
                                    <Minus size={16} />
                                </button>
                                <button
                                    onClick={() => setIsDashed(true)}
                                    className={`p-2 rounded-lg ${isDashed ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/10'}`}
                                    title="Dashed Line"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            <div className="h-4 w-px bg-white/20 mx-2"></div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPaths(prev => prev.slice(0, -1))}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                    title="Undo"
                                >
                                    <Undo size={16} />
                                </button>
                                <button
                                    onClick={() => setPaths([])}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                    title="Clear All Drawings"
                                >
                                    <Eraser size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                    className={`p-4 rounded-full border border-white/20 text-white shadow-2xl active:scale-90 transition-all ${isDrawingMode ? 'bg-emerald-600 border-emerald-400' : 'bg-white/10 backdrop-blur-md'}`}
                >
                    <Pencil size={24} />
                </button>
                <button
                    onClick={handleSave}
                    className="bg-emerald-500 p-4 rounded-full text-white shadow-2xl shadow-emerald-500/40 active:scale-90 transition-transform"
                >
                    <Save size={24} />
                </button>
            </div>

        </div>
    );
};

export default DrillDesignerPage;
