import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { moduleService } from '../services/moduleService';
import { ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Tooltip, Input } from '../components/ui/design-system';
/* Added Box to the imports from lucide-react */
import { Plus, Eye, User, Calendar, Loader2, History, Search, Filter, X, Box } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { TraceDrawer } from '../components/TraceDrawer';
import { STATUS_LABELS } from '../services/workflowGuardrails';
import { routes } from '../../app/routes';

export default function ModuleAssemblyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCluster } = useAppStore();
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [traceId, setTraceId] = useState<string | null>(null);
  
  const batchIdFilter = searchParams.get('batchId') || '';
  const [search, setSearch] = useState(batchIdFilter);

  const canCreate = canDo(currentCluster?.id || '', ScreenId.MODULE_ASSEMBLY_LIST, 'C');

  useEffect(() => {
    moduleService.listModules().then(data => {
      setModules(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case ModuleStatus.SEALED: return <Badge variant="success">{STATUS_LABELS.COMPLETED}</Badge>;
      case ModuleStatus.IN_PROGRESS: return <Badge variant="default">{STATUS_LABELS.IN_PROGRESS}</Badge>;
      case ModuleStatus.DRAFT: return <Badge variant="outline">{STATUS_LABELS.DRAFT}</Badge>;
      case ModuleStatus.QUARANTINED: return <Badge variant="destructive">{STATUS_LABELS.FAILED}</Badge>;
      case ModuleStatus.CONSUMED: return <Badge variant="secondary">CONSUMED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const clearBatchFilter = () => {
    setSearchParams({});
    setSearch('');
  };

  const filtered = modules.filter(m => {
    const matchesSearch = 
        m.id.toLowerCase().includes(search.toLowerCase()) || 
        m.skuCode.toLowerCase().includes(search.toLowerCase()) ||
        m.batchId?.toLowerCase().includes(search.toLowerCase());
    
    if (batchIdFilter) {
        return m.batchId === batchIdFilter && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Module Assembly Queue</h2>
          <p className="text-muted-foreground">Monitor sub-assembly work orders and cell binding progress across active batches.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate(`${routes.moduleAssemblyList()}/new`)} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> New Module Build
          </Button>
        )}
      </div>

      {batchIdFilter && (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-1 duration-300">
              <Badge className="h-8 px-3 bg-indigo-600 gap-2 font-bold uppercase tracking-tight">
                  Batch: {batchIdFilter}
                  <button onClick={clearBatchFilter} className="hover:text-white/80 transition-colors"><X size={12}/></button>
              </Badge>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active workflow filter</p>
          </div>
      )}

      <Card>
        <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID, SKU or Serial..." 
                        className="pl-9" 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Work Order ID</TableHead>
                <TableHead>Batch Link</TableHead>
                <TableHead>SKU Blueprint</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 opacity-60">
                        {/* Fix: Imported Box from lucide-react to resolve the 'Cannot find name Box' error */}
                        <Box size={32} className="text-slate-300" />
                        <p className="text-sm italic">No assembly work orders found in current ledger view.</p>
                        {batchIdFilter && <Button variant="link" size="sm" onClick={clearBatchFilter}>Clear batch filter</Button>}
                    </div>
                </TableCell></TableRow>
              ) : (
                filtered.map(m => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" onClick={() => navigate(routes.moduleDetails(m.id))}>
                    <TableCell className="font-mono font-bold text-primary">{m.id}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono">{m.batchId || '-'}</Badge></TableCell>
                    <TableCell>{m.skuCode}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${(m.boundCellSerials.length / m.targetCells) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono w-10">{m.boundCellSerials.length}/{m.targetCells}</span>
                       </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                           <Tooltip content="Quick Trace">
                               <Button variant="ghost" size="icon" onClick={() => setTraceId(m.id)} className="text-indigo-500"><History size={16} /></Button>
                           </Tooltip>
                           <Button variant="ghost" size="sm" onClick={() => navigate(routes.moduleDetails(m.id))}>Open</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <TraceDrawer isOpen={!!traceId} onClose={() => setTraceId(null)} assetId={traceId || ''} assetType="MODULE" />
    </div>
  );
}