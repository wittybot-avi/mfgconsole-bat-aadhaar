import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input } from '../components/ui/design-system';
import { ClipboardCheck, Play, History, ShieldAlert, ArrowRight, Loader2, Search, Filter } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';
import { routes } from '../../app/routes';

export default function EolQaList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCluster } = useAppStore();
  const [packs, setPacks] = useState<PackInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'passed' | 'failed'>('queue');
  
  const batchIdFilter = searchParams.get('batchId') || '';
  const buildHighlightId = searchParams.get('search') || '';
  const [batchSearch, setBatchSearch] = useState(batchIdFilter || buildHighlightId);

  useEffect(() => {
    loadQueue();
  }, [activeTab, batchSearch]);

  const loadQueue = async () => {
    setLoading(true);
    let statusFilter: PackStatus | undefined;
    if (activeTab === 'passed') statusFilter = PackStatus.PASSED;
    if (activeTab === 'failed') statusFilter = PackStatus.QUARANTINED;
    
    const data = await eolQaService.listEolQueue({ 
      status: statusFilter,
      batchId: batchSearch || undefined
    });
    
    let filtered = data;
    if (activeTab === 'queue') {
      filtered = data.filter(p => p.status === PackStatus.READY_FOR_EOL || p.status === PackStatus.IN_EOL_TEST);
    }

    setPacks(filtered);
    setLoading(false);
  };

  const getStatusBadge = (status: PackStatus) => {
    switch (status) {
      case PackStatus.PASSED: return <Badge variant="success">PASSED</Badge>;
      case PackStatus.QUARANTINED: return <Badge variant="destructive">QUARANTINED</Badge>;
      case PackStatus.IN_EOL_TEST: return <Badge className="bg-blue-500 text-white">TESTING</Badge>;
      case PackStatus.READY_FOR_EOL: return <Badge variant="outline">QUEUED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAnalyze = (id: string) => {
    navigate(routes.eolDetails(id));
  };

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S7"
        title="EOL Testing / QA Queue"
        objective="Validate assembled packs through electrical, thermal, and mechanical verification cycles to certify for shipment."
        entityLabel="QA Workstation"
        status="ACTIVE"
        diagnostics={{ route: '/assure/eol/queue', entityId: 'QA-ST-01' }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Filter by Batch ID or Build ID..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900" 
                value={batchSearch}
                onChange={e => setBatchSearch(e.target.value)}
             />
          </div>
          <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto shrink-0 px-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <button 
              className={`py-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'queue' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
              onClick={() => setActiveTab('queue')}
            >
              <Play size={14} /> Active Queue
            </button>
            <button 
              className={`py-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'passed' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
              onClick={() => setActiveTab('passed')}
            >
              <ClipboardCheck size={14} /> Certified (Pass)
            </button>
            <button 
              className={`py-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'failed' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
              onClick={() => setActiveTab('failed')}
            >
              <ShieldAlert size={14} /> Non-conforming (Fail)
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Build ID</TableHead>
                  <TableHead>Pack Serial</TableHead>
                  <TableHead>Batch Link</TableHead>
                  <TableHead>SKU Blueprint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
                ) : packs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">No packs found in {activeTab} stage matching filters.</TableCell></TableRow>
                ) : (
                  packs.map(p => {
                    const isHighlighted = buildHighlightId === p.id;
                    return (
                      <TableRow key={p.id} className={`cursor-pointer transition-colors ${isHighlighted ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-l-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`} onClick={() => handleAnalyze(p.id)}>
                        <TableCell className="font-mono font-bold text-primary">{p.id}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{p.packSerial || 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-mono">{p.batchId || '-'}</Badge></TableCell>
                        <TableCell>{p.skuCode}</TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); handleAnalyze(p.id); }}>
                              Analyze <ArrowRight size={14} />
                           </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}