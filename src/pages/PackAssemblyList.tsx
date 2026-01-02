import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { packAssemblyService } from '../services/packAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Tooltip, Input } from '../components/ui/design-system';
import { Plus, Eye, Loader2, ArrowRight, History, Search, Filter } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { TraceDrawer } from '../components/TraceDrawer';
import { STATUS_LABELS } from '../services/workflowGuardrails';
import { routes } from '../../app/routes';

export default function PackAssemblyList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCluster } = useAppStore();
  
  const [packs, setPacks] = useState<PackInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('batchId') || '');

  const canCreate = canDo(currentCluster?.id || '', ScreenId.PACK_ASSEMBLY_LIST, 'C');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const pData = await packAssemblyService.listPacks();
    setPacks(pData);
    setLoading(false);
  };

  const getStatusBadge = (status: PackStatus) => {
    switch (status) {
      case PackStatus.FINALIZED: return <Badge variant="success">{STATUS_LABELS.COMPLETED}</Badge>;
      case PackStatus.READY_FOR_EOL: return <Badge className="bg-indigo-500 text-white">READY FOR EOL</Badge>;
      case PackStatus.IN_PROGRESS: return <Badge variant="default">{STATUS_LABELS.IN_PROGRESS}</Badge>;
      case PackStatus.DRAFT: return <Badge variant="outline">{STATUS_LABELS.DRAFT}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filtered = packs.filter(p => 
    p.id.toLowerCase().includes(search.toLowerCase()) || 
    p.skuCode.toLowerCase().includes(search.toLowerCase()) ||
    p.batchId?.toLowerCase().includes(search.toLowerCase()) ||
    p.packSerial?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Main Enclosure Queue</h2>
          <p className="text-muted-foreground">Main assembly line: linking sealed modules into final battery packs.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsStartModalOpen(true)} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> New Pack Build
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID, SN, or Batch..." 
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
                <TableHead>Build ID</TableHead>
                <TableHead>Batch Context</TableHead>
                <TableHead>SKU Blueprint</TableHead>
                <TableHead>Modules Linked</TableHead>
                <TableHead>QC Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No active pack builds found matching filters.</TableCell></TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" onClick={() => navigate(routes.packBuildDetails(p.id))}>
                    <TableCell className="font-mono font-bold text-primary">{p.id}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono">{p.batchId || '-'}</Badge></TableCell>
                    <TableCell>{p.skuCode}</TableCell>
                    <TableCell>{p.moduleIds.length}/{p.requiredModules || 1}</TableCell>
                    <TableCell><Badge variant={p.qcStatus === 'PASSED' ? 'success' : 'outline'}>{p.qcStatus}</Badge></TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                           <Tooltip content="Genealogy">
                               <Button variant="ghost" size="icon" onClick={() => setTraceId(p.id)} className="text-indigo-500"><History size={16} /></Button>
                           </Tooltip>
                           <Button variant="ghost" size="sm" onClick={() => navigate(routes.packBuildDetails(p.id))}>Open</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <TraceDrawer isOpen={!!traceId} onClose={() => setTraceId(null)} assetId={traceId || ''} assetType="PACK" />
    </div>
  );
}