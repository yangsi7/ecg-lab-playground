import { useState, useMemo, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import {
        Heart,
        Filter,
        Download,
        AlertTriangle,
        ChevronUp,
        ChevronDown,
        RefreshCw,
        ChevronLeft,
        ChevronRight,
        MoreHorizontal,
        Save,
        Star
    } from 'lucide-react'
    import { useHolterData, type HolterStudy } from '../../hooks/useHolterData';
    import jsep, { Expression } from 'jsep';
    import { DataGrid } from '../table/DataGrid';

    const QUICK_FILTERS = [
        { id: 'bad-quality', label: 'Bad Quality (<0.5)', icon: AlertTriangle },
        { id: 'needs-intervention', label: 'Needs Intervention (<20h)', icon: AlertTriangle },
        { id: 'under-target', label: 'Under Target (<10h)', icon: AlertTriangle }
    ] as const

    const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

    // For the new jsql filter, we can define recognized tokens for autocomplete:
    const TOKEN_SUGGESTIONS = [
        'daysRemaining', 'qualityFraction', 'totalHours', 'interruptions', 'qualityVariance'
    ]

    // New parseAdvancedFilter function using jsep
    function parseAdvancedFilter(expression: string, study: HolterStudy): boolean {
        try {
            const ast = jsep(expression);

            const evaluateNode = (node: Expression): any => {
                switch (node.type) {
                    case 'BinaryExpression':
                        const left = evaluateNode((node as any).left);
                        const right = evaluateNode((node as any).right);
                        switch ((node as any).operator) {
                            case '<': return left < right;
                            case '>': return left > right;
                            case '<=': return left <= right;
                            case '>=': return left >= right;
                            case '==': return left == right; // Deliberate ==
                            case '!=': return left != right; // Deliberate !=
                            case '&&': return left && right;
                            case '||': return left || right;
                            default:
                                throw new Error(`Unknown operator: ${(node as any).operator}`);
                        }
                    case 'UnaryExpression':
                        const argument = evaluateNode((node as any).argument);
                        switch ((node as any).operator) {
                            case '!': return !argument;
                            default:
                                throw new Error(`Unknown unary operator: ${(node as any).operator}`);
                        }
                    case 'Literal':
                        return (node as any).value;
                    case 'Identifier':
                        switch ((node as any).name) {
                            case 'daysRemaining': return study.daysRemaining ?? null;
                            case 'qualityFraction': return study.qualityFraction ?? null;
                            case 'totalHours': return study.totalHours ?? null;
                            case 'interruptions': return study.interruptions ?? 0;
                            case 'qualityVariance': return study.qualityVariance ?? 0;
                            default:
                                throw new Error(`Unknown identifier: ${(node as any).name}`);
                        }
                    default:
                        throw new Error(`Unknown node type: ${node.type}`);
                }
            };

            return !!evaluateNode(ast);
        } catch (error) {
            console.error("Filter parsing error:", error);
            return false; // Assume false on error
        }
    }

    function getSavedPresetsLS(): string[] {
        const raw = localStorage.getItem('holterFilterPresets')
        if (!raw) return []
        try {
            return JSON.parse(raw)
        } catch {
            return []
        }
    }

    function setSavedPresetsLS(arr: string[]) {
        localStorage.setItem('holterFilterPresets', JSON.stringify(arr))
    }

    export default function HolterLab() {
        const navigate = useNavigate()
        const [quickFilter, setQuickFilter] = useState<typeof QUICK_FILTERS[number]['id']>()
        const [advancedFilter, setAdvancedFilter] = useState('')
        const [filterError, setFilterError] = useState<string | null>(null)

        // We'll store presets in localState + localStorage
        const [savedPresets, setSavedPresets] = useState<string[]>([])

        // show/hide advanced filter fields
        const [showFields, setShowFields] = useState(false)

        // For advanced autocomplete
        const [autocompleteOpen, setAutocompleteOpen] = useState(false)
        const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>(TOKEN_SUGGESTIONS)

        const [currentPage, setCurrentPage] = useState(0)
        const [pageSize, setPageSize] = useState(25)
        const [sortConfig, setSortConfig] = useState<{ key: keyof HolterStudy; direction: 'asc' | 'desc' }>({
            key: 'daysRemaining',
            direction: 'desc'
        })

        const { studies = [], previousStudies = [], loading, error, totalCount = 0, isRefreshing } =
            useHolterData({
                quickFilter: quickFilter as any,
                sortBy: sortConfig.key,
                sortDirection: sortConfig.direction,
                page: currentPage,
                pageSize
            })

        // Load any saved presets from localStorage on mount
        useEffect(() => {
            const stored = getSavedPresetsLS()
            setSavedPresets(stored)
        }, [])

        const handleSavePreset = () => {
            if (!advancedFilter.trim() || filterError) return
            const newPresets = [...savedPresets, advancedFilter]
            setSavedPresets(newPresets)
            setSavedPresetsLS(newPresets)
        }

        const handleSelectPreset = (preset: string) => {
            setAdvancedFilter(preset)
            setCurrentPage(0)
        }

        const totalPages = Math.ceil(totalCount / pageSize)

        const handleAdvancedFilterChange = (val: string) => {
            setAdvancedFilter(val)
            setFilterError(null)
            setCurrentPage(0)
            // Removed try-catch, jsep handles errors internally
        }

        // When user is typing advanced filter, we can show a simple "autocomplete" dropdown
        const handleFilterInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
            // naive approach: if user types a letter after " ", we might open
            setAutocompleteOpen(true)
        }

        const filteredStudies = useMemo(() => {
            if (!advancedFilter.trim()) return studies
            return studies.filter(s => parseAdvancedFilter(advancedFilter, s)); // Use new parser
        }, [studies, advancedFilter])

        const handleSort = (key: keyof HolterStudy) => {
            setSortConfig(c => ({
                key,
                direction: c.key === key && c.direction === 'asc' ? 'desc' : 'asc'
            }))
            setCurrentPage(0)
        }

        const handlePageSizeChange = (num: number) => {
            setPageSize(num)
            setCurrentPage(0)
        }

        const startIndex = currentPage * pageSize
        const endIndex = startIndex + pageSize
        const pageRows = filteredStudies.slice(startIndex, endIndex)
        const localCount = filteredStudies.length

        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
            )
        }

        if (error) {
            return (
                <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-red-400">Error loading Holter data</h3>
                    <p className="mt-1 text-sm text-red-300">{error}</p>
                </div>
            )
        }

        const columns = useMemo(() => [
            { key: 'study_id', header: 'Study ID', sortable: true },
            { key: 'clinic_name', header: 'Clinic', sortable: true },
            { key: 'duration', header: 'Duration', sortable: true },
            { key: 'daysRemaining', header: 'Days Rem', sortable: true },
            { key: 'totalQualityHours', header: 'Q Hours', sortable: true },
            { key: 'qualityFraction', header: 'Q %', sortable: true },
            { key: 'totalHours', header: 'Total Hrs', sortable: true },
            { key: 'interruptions', header: 'Interrupts', sortable: true },
            { key: 'qualityVariance', header: 'Variance', sortable: true },
            { key: 'status', header: 'Status', sortable: true },
        ], []);

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Heart className="h-8 w-8 text-blue-400" />
                        <h1 className="text-2xl font-semibold text-white">Holter Studies</h1>
                    </div>
                    <button
                        onClick={() => {}}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                    >
                        <Download className="h-4 w-4" />
                        Export Data
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2">
                    {QUICK_FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setQuickFilter(cur => (cur === filter.id ? undefined : filter.id))}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                transition-all duration-200
                                ${quickFilter === filter.id
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
                                }
                            `}
                        >
                            <filter.icon className="h-4 w-4" />
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Advanced Filter Box */}
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-3 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-300" />
                            <h2 className="text-sm text-gray-300 font-medium">Advanced Filter</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFields(!showFields)}
                                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleSavePreset}
                                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition"
                            >
                                <Save className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {showFields && (
                        <div className="rounded-md bg-white/5 p-3 border border-white/10 space-y-2">
                            <div className="text-xs text-gray-200 italic">
                                Example tokens: daysRemaining, qualityFraction, totalHours, interruptions, qualityVariance
                            </div>
                            {!!savedPresets.length && (
                                <div className="mt-2 space-x-1">
                                    {savedPresets.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectPreset(p)}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                        >
                                            <Star className="h-3 w-3" />
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type="text"
                            value={advancedFilter}
                            onChange={e => handleAdvancedFilterChange(e.target.value)}
                            onKeyUp={handleFilterInputKeyUp}
                            placeholder="e.g. daysRemaining < 2 and qualityFraction < 0.6"
                            className="w-full px-3 py-2 rounded-md text-sm bg-white/5 text-white border border-white/10 focus:border-blue-400 focus:outline-none"
                        />
                        {filterError && <p className="text-xs text-red-400 mt-1">{filterError}</p>}

                        {/* Simple overlay for autoComplete suggestions */}
                        {autocompleteOpen && (
                            <div className="absolute top-14 left-0 w-full bg-black/90 border border-white/10 rounded-md shadow-lg z-50">
                                {autocompleteOptions.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            // Insert token
                                            setAdvancedFilter(af => af + (af.endsWith(' ') ? '' : ' ') + opt)
                                            setAutocompleteOpen(false)
                                        }}
                                        className="px-3 py-2 text-sm text-gray-200 hover:bg-white/10 cursor-pointer"
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Size + Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Show</span>
                        <select
                            value={pageSize}
                            onChange={e => handlePageSizeChange(Number(e.target.value))}
                            className="bg-white/10 border border-white/10 rounded-lg text-white text-sm px-2 py-1"
                        >
                            {PAGE_SIZE_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-400">entries</span>
                    </div>
                    <div className="text-sm text-gray-400">
                        Showing {pageRows.length ? startIndex + 1 : 0} to {Math.min(endIndex, localCount)} of {localCount} entries
                    </div>
                </div>

                {/* Main Table */}
                <DataGrid data={filteredStudies} columns={columns} defaultSortKey="daysRemaining" />

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        Showing {pageRows.length ? startIndex + 1 : 0} to {Math.min(endIndex, localCount)} of {localCount} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className={`
                                flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium
                                ${currentPage === 0
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }
                            `}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className={`
                                flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium
                                ${currentPage >= totalPages - 1
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }
                            `}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }
