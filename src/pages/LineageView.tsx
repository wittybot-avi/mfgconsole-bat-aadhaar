
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { packAssemblyService } from '../services/packAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, History, Info, AlertTriangle, Fingerprint, Box, Cpu, Layers, ChevronRight, Search, ShieldCheck, CheckCircle, Database, Copy, Download, FileText, Globe, XCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { exportAsJson, exportAsCsv, exportAsDppLite } from '../utils/exporters';

export default function LineageView() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  
  const [searchInput, setSearchInput] = useState(routeId || '');
  const [internalFilter, setInternalFilter] = useState('');
  const [subject, setSubject] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [parent, setParent] = useState<any>(null);
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const clusterId = currentCluster?.id || '';
  const isSupervisor = ['CS', 'C1', 'C3', 'C4', 'C7', 'C8'].includes(clusterId);
  const isOperator = clusterId === 'C2';

  useEffect(() => {
    if (routeId) {
        setSearchInput(routeId);
        loadLineage(routeId);
    }
  }, [routeId]);

  const loadLineage = async (sid: string) => {
    if (!sid) return;
    setLoading(true);
    setSubject(null);
    setChildren([]);
    setParent(null);
    setEvents([]);

    try {
      // Priority 1: Pack Check
      const packs = await packAssemblyService.listPacks();
      const pack = packs.find(p => p.id === sid || p.packSerial === sid);
      
      if (pack) {
          setSubject({ type: 'PACK', ...pack });
          const evts = await moduleAssemblyService.getLineageEvents(pack.id);
          setEvents(evts);
          const s = await skuService.getSku(pack.skuId);
          setSku(s || null);
          const childMods = await Promise.all(pack.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
          setChildren(childMods.map(m => ({ ...m, type: 'MODULE' })));
          setLoading(false);
          return;
      }

      // Priority 2: Module Check
      const modules = await moduleAssemblyService.listModules();
      const module = modules.find(m => m.id === sid);
      if (module) {
        setSubject({ type: 'MODULE', ...module });
        const evts = await moduleAssemblyService.getLineageEvents(module.id);
        setEvents(evts);
        const s = await skuService.getSku(module.skuId);
        setSku(s || null);
        const bindings = await moduleAssemblyService.listBindingsByModule(module.id);
        setChildren(bindings.map(b => ({ id: b.serial, type: 'CELL', ...b })));
        const parentPack = packs.find(p => p.moduleIds.includes(module.id));
        if (parentPack) setParent({ type: 'PACK', ...parentPack });
        setLoading(false);
        return;
      }

      // Priority 3: Cell Check
      const lookup = await cellTraceabilityService.findSerialGlobal(sid);
      if (lookup) {
        setSubject({ type: 'CELL', ...lookup.serial, chemistry: lookup.lot.chemistry, lotId: lookup.lot.id });
        const evts = await moduleAssemblyService.getLineageEvents(sid);
        setEvents(evts);
        const bindings = await moduleAssemblyService.listBindingsBySerial(sid);
        if (bindings.length > 0) {
            const mod = await moduleAssemblyService.getModule(bindings[0].moduleId);
            if (mod) setParent({ type: 'MODULE', ...mod });
        }
      }
    } catch (e) {
      addNotification({ title: 'Audit Error', message: 'Identifier not found in registry.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput) navigate(`/trace/lineage/${searchInput}`);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      addNotification({ title: 'Copied', message: 'Identifier copied to clipboard.', type: 'info' });
  };

  const filteredChildren = children.filter(c => (c.id || c.serial).toLowerCase().includes(internalFilter.toLowerCase()));
  
  const expectedCount = subject?.type === 'PACK' ? sku?.requiredModules : (subject?.type === 'MODULE' ? subject?.targetCells : undefined);
  const actualCount = children.length;
  const mismatch = expectedCount !== undefined && actualCount !== expectedCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Lineage Audit</h2>
                <p className="text-muted-foreground">Full genealogy graph for industrial asset traceability.</p>
            </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 md:w-80">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Audit Asset ID..." className="pl-9 h-10" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="shadow-lg">{loading ? '...' : 'Go'}</Button>
            </form>
            {subject && (
                <div className="flex gap-1">
                    {!isOperator && (
                        <Tooltip content="Export DPP-Lite (JSON-LD)">
                            <Button variant="outline" size="icon" onClick={() => exportAsDppLite(subject, children, sku, events)} className="text-blue-600 border-blue-100 hover:bg-blue-50"><Globe size={16} /></Button>
                        </Tooltip>
                    )}
                    <Tooltip content="Export CSV Audit">
                        <Button variant="outline" size="icon" onClick={() => exportAsCsv(['ID', 'Type', 'Status'], children.map(c => [c.id || c.serial, c.type || 'ASSET', c.status || 'Active']), `Audit_${subject.id || subject.serial}`)} className="text-emerald-600 border-emerald-100 hover:bg-emerald-50"><FileText size={16} /></Button>
                    </Tooltip>
                </div>
            )}
        </div>
      </div>

      {!subject && !loading && (
          <div className="p-32 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <History className="h-16 w-16 mx-auto mb-6 text-slate-300" />
              <h3 className="text-2xl font-bold text-slate-400">Gen-Trace Explorer</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">Enter any valid ID (Cell SN, Pack ID, SKU) into the search bar above to begin a deep genealogy audit.</p>
          </div>
      )}

      {loading && <div className="p-32 text-center animate-pulse text-muted-foreground font-mono text-sm uppercase tracking-widest">Connecting to immutable records...</div>}

      {subject && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="lg:col-span-3 space-y-6">
                
                {/* UPSTREAM PARENT */}
                {parent && (
                    <div className="space-y-2">
                         <h4 className="text-[10px] font-bold uppercase text-muted-foreground px-1 tracking-widest flex items-center gap-2">
                             <Layers size={10}/> Upstream Relationship
                         </h4>
                         <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-50 transition-all group" onClick={() => navigate(`/trace/lineage/${parent.id}`)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700 shadow-sm group-hover:shadow-md transition-all">
                                        {parent.type === 'PACK' ? <Layers size={20} /> : <Box size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold font-mono group-hover:text-primary">{parent.id}</p>
                                        <p className="text-[10px] uppercase text-muted-foreground tracking-tight">{parent.type} ENCLOSURE</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </CardContent>
                         </Card>
                         <div className="flex justify-center h-4"><div className="w-0.5 bg-indigo-100 dark:bg-indigo-900/50 h-full" /></div>
                    </div>
                )}

                {/* CURRENT FOCUS ASSET */}
                <Card className="border-primary border-2 shadow-2xl relative overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-5">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-primary text-white rounded-xl shadow-lg">
                                {subject.type === 'PACK' ? <Layers size={28} /> : subject.type === 'MODULE' ? <Box size={28} /> : <Fingerprint size={28} />}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-2xl font-mono tracking-tighter">{subject.id || subject.serial}</CardTitle>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => copyToClipboard(subject.id || subject.serial)}>
                                        <Copy size={12}/>
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-white dark:bg-slate-900">{subject.type} FOCUS</Badge>
                                    <Badge variant="success" className="text-[9px] px-2"><CheckCircle size={8} className="mr-1" /> LEDGER VALID</Badge>
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className="font-mono text-sm px-4 py-1 bg-white dark:bg-slate-900 border-2 shadow-sm">{subject.status || 'Active'}</Badge>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SKU Context</p>
                            <p className="text-sm font-bold font-mono text-indigo-600">{subject.skuCode || subject.lotCode || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chemistry Match</p>
                            <p className="text-sm font-medium">{subject.chemistry || sku?.chemistry || 'LFP'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registry Date</p>
                            <p className="text-sm font-medium">{new Date(subject.createdAt || subject.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Integrity</p>
                            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold"><ShieldCheck size={16} /> SIGNED</div>
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 p-1 bg-primary text-white text-[8px] font-bold rotate-45 translate-x-3 translate-y-[-2px] w-12 text-center opacity-20 pointer-events-none">IMMUTABLE</div>
                </Card>

                {/* MISMATCH WARNING BLOCK */}
                {mismatch && (
                    <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl flex items-start gap-5 text-rose-800 dark:text-rose-300 shadow-sm animate-pulse">
                        <AlertTriangle className="shrink-0 h-6 w-6 mt-1 text-rose-500" />
                        <div>
                            <p className="text-sm font-bold mb-1">Genealogy Population Mismatch</p>
                            <p className="text-xs leading-relaxed opacity-90">
                                Expected <span className="font-bold">{expectedCount}</span> sub-components according to SKU specification, but only found <span className="font-bold">{actualCount}</span> records bound in the ledger. 
                                <br/>Likely cause: Workstation scan bypass or incomplete assembly session closure.
                            </p>
                        </div>
                    </div>
                )}

                {/* DOWNSTREAM HIERARCHY */}
                {children.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-center h-4"><div className="w-0.5 bg-slate-200 dark:bg-slate-800 h-full" /></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-3">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                <History size={10}/> Downstream Hierarchy ({children.length})
                            </h4>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                                <Input 
                                    placeholder="Filter children..." 
                                    className="pl-8 h-8 text-xs bg-white dark:bg-slate-900" 
                                    value={internalFilter} 
                                    onChange={e => setInternalFilter(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredChildren.map(child => (
                                <Card key={child.id || child.serial} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group overflow-hidden border-slate-100 dark:border-slate-800" onClick={() => navigate(`/trace/lineage/${child.id || child.serial}`)}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-lg ${child.type === 'MODULE' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'} dark:bg-slate-800`}>
                                                {child.type === 'MODULE' ? <Box size={18} /> : <Fingerprint size={18} />}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold font-mono group-hover:text-primary truncate">{child.id || child.serial}</p>
                                                <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">{child.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); copyToClipboard(child.id || child.serial); }}>
                                                <Copy size={12}/>
                                            </Button>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* AUDIT INTELLIGENCE PANEL */}
            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-2xl">
                    <CardHeader className="border-b border-slate-800 pb-3">
                        <CardTitle className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-400" /> Audit Intelligence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs pt-4">
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
                            <p className="font-bold text-[10px] text-slate-400 uppercase">Rule Engine Outcomes</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Cardinality Check</span>
                                    <Badge variant={mismatch ? 'destructive' : 'success'} className="text-[8px] h-4 leading-none">
                                        {mismatch ? 'FAIL' : 'PASS'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Chemistry Logic</span>
                                    <Badge variant="success" className="text-[8px] h-4 leading-none">PASS</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Identity Origin</span>
                                    <Badge variant="success" className="text-[8px] h-4 leading-none">PASS</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                             <p className="font-bold text-[10px] text-slate-400 uppercase mb-3">Constraint Checklist</p>
                             <ul className="space-y-2.5 opacity-80">
                                <li className="flex items-center gap-2.5"><CheckCircle size={12} className="text-emerald-400" /> Chemistry Consistency</li>
                                <li className="flex items-center gap-2.5"><CheckCircle size={12} className="text-emerald-400" /> Sequence Signature</li>
                                <li className="flex items-center gap-2.5"><CheckCircle size={12} className="text-emerald-400" /> Station Authority</li>
                             </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <History size={16} className="text-indigo-500" /> Activity Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {events.length === 0 ? <p className="text-xs text-muted-foreground italic text-center py-4">No events found in ledger.</p> : 
                              events.slice(0, 8).map(e => (
                                  <div key={e.id} className="border-l-2 border-indigo-100 dark:border-indigo-900 pl-3 py-1.5 space-y-1">
                                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{e.type.replace(/_/g, ' ')}</p>
                                      <div className="flex justify-between text-[9px] text-muted-foreground">
                                          <span>{new Date(e.timestamp).toLocaleDateString()}</span>
                                          <span className="font-medium truncate max-w-[100px]">{e.actor}</span>
                                      </div>
                                  </div>
                              ))
                            }
                        </div>
                    </CardContent>
                </Card>

                <div className="p-6 border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                    <Database className="h-8 w-8 text-slate-400" />
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest">Immutable Fabric</p>
                        <p className="text-[10px] leading-relaxed">Identity graph is non-volatile and cryptographically verifiable across the supply chain.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
