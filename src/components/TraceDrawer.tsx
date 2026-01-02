
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from './ui/design-system';
import { X, History, Layers, Box, Fingerprint, ChevronRight, ShieldCheck, AlertTriangle, Download, ExternalLink, Database, CheckCircle } from 'lucide-react';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { packAssemblyService } from '../services/packAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { skuService, Sku } from '../services/skuService';
import { exportAsJson, exportAsCsv } from '../utils/exporters';
import { useAppStore } from '../lib/store';

interface TraceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    assetType: 'CELL' | 'MODULE' | 'PACK';
}

export const TraceDrawer: React.FC<TraceDrawerProps> = ({ isOpen, onClose, assetId, assetType }) => {
    const navigate = useNavigate();
    const { currentCluster } = useAppStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sku, setSku] = useState<Sku | null>(null);

    // RBAC: Operator can only export CSV
    const isOperator = currentCluster?.id === 'C2';

    useEffect(() => {
        if (isOpen && assetId) loadData();
    }, [isOpen, assetId]);

    const loadData = async () => {
        setLoading(true);
        try {
            let res: any = null;
            if (assetType === 'PACK') {
                res = await packAssemblyService.getPack(assetId);
            } else if (assetType === 'MODULE') {
                res = await moduleAssemblyService.getModule(assetId);
            } else {
                const lookup = await cellTraceabilityService.findSerialGlobal(assetId);
                res = lookup ? { ...lookup.serial, type: 'CELL' } : null;
            }
            
            if (res) {
                setData(res);
                const s = await skuService.getSku(res.skuId);
                setSku(s || null);
            }
        } catch (e) {
            console.error("Trace load failed:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleFullAudit = () => {
        navigate(`/trace/lineage/${assetId}`);
        onClose();
    };

    const targetCount = assetType === 'PACK' ? (sku?.requiredModules || 0) : (data?.targetCells || 0);
    const boundCount = assetType === 'PACK' ? (data?.moduleIds?.length || 0) : (data?.boundCellSerials?.length || 0);
    const complianceMismatch = targetCount !== boundCount;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose} />
            
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col relative animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded">
                            <History size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trace Quick View</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{assetType} RECORD</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Scanning immutable ledger...</div>
                    ) : data ? (
                        <>
                            {/* Summary Header */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-2xl font-mono font-bold tracking-tight">{assetId}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline">{data.status || 'Active'}</Badge>
                                        <Tooltip content="SKU Blueprint Code">
                                            <Badge variant="secondary" className="font-mono text-[10px]">{data.skuCode || 'N/A'}</Badge>
                                        </Tooltip>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-muted-foreground mb-1 uppercase font-bold text-[9px]">Created At</p>
                                        <p className="font-medium">{new Date(data.createdAt || data.generatedAt).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-muted-foreground mb-1 uppercase font-bold text-[9px]">Last Actor</p>
                                        <p className="font-medium truncate">{data.createdBy || data.actor || 'System'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Relationship Tree Snippet */}
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Chain of Custody Snippet</h5>
                                {assetType === 'PACK' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-indigo-600 font-bold">
                                            <Layers size={14} /> Linked Modules ({boundCount})
                                        </div>
                                        <div className="pl-6 space-y-1 border-l-2 border-slate-100 dark:border-slate-800">
                                            {data.moduleIds?.slice(0, 5).map((mid: string) => (
                                                <div key={mid} className="text-xs font-mono p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/operate/modules/${mid}`)}>
                                                    <span>{mid}</span>
                                                    <ChevronRight size={10} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                                                </div>
                                            ))}
                                            {data.moduleIds?.length > 5 && <p className="text-[9px] text-muted-foreground italic mt-1">+{data.moduleIds.length - 5} more...</p>}
                                        </div>
                                    </div>
                                )}
                                {assetType === 'MODULE' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                                            <Fingerprint size={14} /> Bound Cells ({boundCount})
                                        </div>
                                        <div className="pl-6 space-y-1 border-l-2 border-slate-100 dark:border-slate-800">
                                            {data.boundCellSerials?.slice(0, 8).map((s: string) => (
                                                <div key={s} className="text-[11px] font-mono p-1 flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                            {data.boundCellSerials?.length > 8 && <p className="text-[9px] text-muted-foreground italic mt-1">+{data.boundCellSerials.length - 8} more...</p>}
                                        </div>
                                    </div>
                                )}
                                {assetType === 'CELL' && (
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        <p className="text-sm">Atomic level asset. Genealogy available in full lineage view.</p>
                                    </div>
                                )}
                            </div>

                            {/* Ledger Compliance Card */}
                            <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden">
                                <CardContent className="p-4 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rule Engine Consistency</h5>
                                        {complianceMismatch ? (
                                            <AlertTriangle size={16} className="text-rose-400" />
                                        ) : (
                                            <ShieldCheck size={16} className="text-emerald-400" />
                                        )}
                                    </div>
                                    <div className="space-y-3 text-xs">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">Population Match:</span>
                                            <span className={`font-mono ${complianceMismatch ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {boundCount} / {targetCount}
                                            </span>
                                        </div>
                                        {complianceMismatch && (
                                            <div className="text-[10px] text-rose-300 leading-relaxed italic opacity-80">
                                                Mismatch detected against SKU Blueprint. Workflow signature may be incomplete.
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Lot Identity Validation:</span>
                                            <span className="text-emerald-400 uppercase font-bold text-[9px]">Verified</span>
                                        </div>
                                    </div>
                                    <Database className="absolute -right-2 -bottom-2 h-12 w-12 text-white/5" />
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="py-20 text-center">
                            <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-4 opacity-50" />
                            <p className="text-sm text-muted-foreground italic">Subject identifier not found in the decentralized registry.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 dark:bg-slate-800 space-y-2 shrink-0">
                    <Button className="w-full shadow-lg" onClick={handleFullAudit} disabled={!data}>
                        <ExternalLink size={14} className="mr-2" /> Open Full Genealogy Audit
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => exportAsJson(data, `Trace_${assetId}`)} 
                            disabled={!data || isOperator}
                            className="bg-white dark:bg-slate-900"
                        >
                            <Download size={12} className="mr-2" /> JSON
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => exportAsCsv(['Identifier', 'Type', 'Status'], [[assetId, assetType, data.status]], `Trace_${assetId}`)} 
                            disabled={!data}
                            className="bg-white dark:bg-slate-900"
                        >
                            <Download size={12} className="mr-2" /> CSV
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
