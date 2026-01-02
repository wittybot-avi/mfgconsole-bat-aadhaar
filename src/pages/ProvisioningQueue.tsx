
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { Battery } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input } from '../components/ui/design-system';
import { Cpu, Search, ArrowRight, Loader2, Zap, History, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';

export default function ProvisioningQueue() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await eolQaService.listProvisioningQueue();
      setBatteries(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = batteries.filter(b => 
    b.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.batchId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S9"
        title="Provisioning Operations Queue"
        objective="Execute firmware baseline installation and BMS-level calibration for certified packs."
        entityLabel="Logistics Hub"
        status="ACTIVE"
        diagnostics={{ route: '/manufacturing/provisioning/queue', entityId: 'PROV-WH-01' }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter by SN or Batch..." className="pl-9 h-10 bg-white dark:bg-slate-900" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
                <Badge variant="outline" className="h-10 px-4 bg-slate-50 dark:bg-slate-900 border-dashed">
                    <Zap size={14} className="text-amber-500 mr-2" />
                    {batteries.length} Units Pending
                </Badge>
            </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Asset ID (S8)</TableHead>
                  <TableHead>Batch Context</TableHead>
                  <TableHead>SoH</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead className="text-right">Execution</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="italic text-sm">No assets are currently awaiting S9 Provisioning.</p>
                    <p className="text-xs mt-1">Packs must complete S8 Certification before appearing here.</p>
                  </TableCell></TableRow>
                ) : (
                  filtered.map(b => (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <TableCell className="font-mono font-bold text-primary">{b.serialNumber}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-mono">{b.batchId}</Badge></TableCell>
                      <TableCell className="text-sm font-bold">{b.soh?.toFixed(1)}%</TableCell>
                      <TableCell>
                          <div className="flex items-center text-emerald-600 font-bold text-xs gap-1.5 uppercase">
                              <ShieldCheck size={14} /> Certified
                          </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button onClick={() => navigate(`/assure/provisioning/${b.id}`)} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all">
                            Provision BMS <ArrowRight size={14} />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
