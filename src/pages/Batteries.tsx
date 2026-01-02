import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { batteryService, batchService } from '../services/api';
import { Battery, BatteryStatus, Batch } from '../domain/types';
import { Button, Input, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Card, CardContent, Tooltip } from '../components/ui/design-system';
import { Plus, Search, Filter, Eye, QrCode, Cpu, CheckCircle, Truck, FileDown, ClipboardCheck, Loader2, ZapOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '../lib/store';
import { routes } from '../../app/routes';

// --- Helpers ---
const getStatusVariant = (status: BatteryStatus) => {
  switch (status) {
    case BatteryStatus.DEPLOYED: return 'success';
    case BatteryStatus.IN_INVENTORY: return 'default';
    case BatteryStatus.QA_TESTING: return 'warning';
    case BatteryStatus.PROVISIONING: return 'secondary';
    case BatteryStatus.ASSEMBLY: return 'outline';
    case BatteryStatus.RMA: return 'destructive';
    default: return 'outline';
  }
};

// --- Register Modal ---
const registerBatterySchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  quantity: z.number().min(1).max(50, "Max 50 per batch registration"),
});

const RegisterBatteryModal = ({ isOpen, onClose, onRegistered }: any) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(registerBatterySchema)
  });
  const [loading, setLoading] = useState(false);
  const [activeBatches, setActiveBatches] = useState<Batch[]>([]);

  useEffect(() => {
    if (isOpen) {
        batchService.getBatches().then(data => setActiveBatches(data));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await batteryService.registerBatteries(data.batchId, data.quantity, "CurrentUser");
      reset();
      onRegistered();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[400px] shadow-xl border dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4">Register New Batteries</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Production Batch</label>
            <select {...register('batchId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select Batch...</option>
                {activeBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.batchNumber} ({b.sku})</option>
                ))}
            </select>
            {errors.batchId && <p className="text-xs text-red-500">{errors.batchId.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input type="number" {...register('quantity', { valueAsNumber: true })} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Generate IDs'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Batteries() {
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [eolFilter, setEolFilter] = useState<string>('All');

  // RBAC Checks
  const isSuperUser = currentCluster?.id === 'CS';
  const isC1 = currentCluster?.id === 'C1';
  const isC2 = currentCluster?.id === 'C2';
  const isC3 = currentCluster?.id === 'C3';
  const isC5 = currentCluster?.id === 'C5';
  const isC6 = currentCluster?.id === 'C6';
  const isC7 = currentCluster?.id === 'C7';
  const isC8 = currentCluster?.id === 'C8';
  const isC9 = currentCluster?.id === 'C9';

  const canRegister = isSuperUser || isC2;
  const canProvision = isSuperUser || isC5;
  const canUploadEOL = isSuperUser || isC3;
  const canDispatch = isSuperUser || isC6;
  const canExport = isSuperUser || isC1 || isC3 || isC7 || isC8 || isC9;

  useEffect(() => {
    loadBatteries();
  }, [search, statusFilter, eolFilter]);

  const loadBatteries = async () => {
    setLoading(true);
    try {
      const data = await batteryService.getBatteries({ 
          search, 
          status: statusFilter, 
          eolResult: eolFilter 
      });
      setBatteries(data);
    } catch (err) {
      console.error("Failed to load battery trace", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const val = (e.target as HTMLInputElement).value;
          if (val) {
             navigate(routes.batteryIdentityDetails('batt-0')); // Mock recovery
             addNotification({ title: "Scan Success", message: "Redirecting to battery details...", type: "success" });
          }
      }
  };

  const handleRegisterSuccess = () => {
      addNotification({ title: "Success", message: "Batteries registered successfully", type: "success" });
      loadBatteries();
  };

  const handleRowAction = async (e: React.MouseEvent, action: string, batt: Battery) => {
    e.stopPropagation();
    try {
      if (action === 'provision') {
         if (!window.confirm(`Provision BMS for ${batt.serialNumber}?`)) return;
         await batteryService.provisionBattery(batt.id, { bmsUid: `BMS-${Date.now()}`, firmware: 'v2.2.0', profile: 'STD' });
         addNotification({ title: "Provisioned", message: "BMS bound successfully", type: "success" });
      } else if (action === 'dispatch') {
         const dest = window.prompt("Enter Destination:");
         if (!dest) return;
         await batteryService.dispatchBattery(batt.id, dest);
         addNotification({ title: "Dispatched", message: "Movement order created", type: "success" });
      } else if (action === 'export') {
         addNotification({ title: "Exporting", message: "Downloading certificate...", type: "info" });
      }
      loadBatteries();
    } catch (err: any) {
      addNotification({ title: "Error", message: err.message, type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Batteries</h2>
          <p className="text-muted-foreground">Trace individual packs through manufacturing, testing, and lifecycle.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <QrCode className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-600" />
              <Input 
                placeholder="Scan / Enter SN..." 
                className="pl-9 w-[200px] border-emerald-500/50 focus-visible:ring-emerald-500" 
                onKeyDown={handleScan}
              />
           </div>
          {canRegister && (
            <Button onClick={() => setIsRegisterOpen(true)} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" /> Register
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by SN or Batch..." 
                className="pl-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(BatteryStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
               <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={eolFilter}
                onChange={(e) => setEolFilter(e.target.value)}
              >
                <option value="All">EOL Result</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Batch Link</TableHead>
                {!isC9 && <TableHead>Status</TableHead>}
                {!isC9 && <TableHead>Provisioning</TableHead>}
                <TableHead>EOL Result</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={7} className="py-5">
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : batteries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ZapOff className="h-12 w-12 opacity-10 mb-2" />
                      <p className="font-medium">No batteries found.</p>
                      <p className="text-xs">No assets match your current role or search parameters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                batteries.map((batt) => (
                  <TableRow key={batt.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(routes.batteryIdentityDetails(batt.id))}>
                    <TableCell className="font-medium font-mono">
                      {batt.serialNumber}
                      {batt.reworkFlag && <Badge variant="warning" className="ml-2 text-[10px]">Rework</Badge>}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={routes.batchDetails(batt.batchId)} 
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {batt.batchId}
                      </Link>
                    </TableCell>
                    {!isC9 && (
                        <TableCell>
                            <Badge variant={getStatusVariant(batt.status)}>{batt.status}</Badge>
                        </TableCell>
                    )}
                    {!isC9 && (
                        <TableCell>
                            {batt.provisioningStatus === 'DONE' ? (
                                <div className="flex items-center text-emerald-600 text-xs"><Cpu className="h-3 w-3 mr-1" /> Bound</div>
                            ) : (
                                <span className="text-muted-foreground text-xs">Pending</span>
                            )}
                        </TableCell>
                    )}
                    <TableCell>
                       {batt.eolResult === 'PASS' ? <Badge variant="success">PASS</Badge> : batt.eolResult === 'FAIL' ? <Badge variant="destructive">FAIL</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(batt.lastSeen).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                          <Tooltip content="View Details">
                            <Button variant="ghost" size="icon" onClick={() => navigate(routes.batteryIdentityDetails(batt.id))}>
                                <Eye className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                          
                          {canProvision && batt.status === BatteryStatus.ASSEMBLY && (
                            <Tooltip content="Provision BMS">
                                <Button variant="ghost" size="icon" onClick={(e) => handleRowAction(e, 'provision', batt)} className="text-blue-600">
                                    <Cpu className="h-4 w-4" />
                                </Button>
                            </Tooltip>
                          )}

                          {canUploadEOL && batt.status === BatteryStatus.QA_TESTING && (
                             <Tooltip content="Upload QA Data">
                                <Button variant="ghost" size="icon" onClick={(e) => navigate(routes.batteryIdentityDetails(batt.id))} className="text-amber-600">
                                    <ClipboardCheck className="h-4 w-4" />
                                </Button>
                             </Tooltip>
                          )}

                          {canDispatch && batt.status === BatteryStatus.IN_INVENTORY && (
                             <Tooltip content="Dispatch">
                                <Button variant="ghost" size="icon" onClick={(e) => handleRowAction(e, 'dispatch', batt)} className="text-slate-600 dark:text-slate-400">
                                    <Truck className="h-4 w-4" />
                                </Button>
                             </Tooltip>
                          )}

                          {canExport && batt.certificateRef && (
                             <Tooltip content="Download Cert">
                                <Button variant="ghost" size="icon" onClick={(e) => handleRowAction(e, 'export', batt)} className="text-emerald-600">
                                    <FileDown className="h-4 w-4" />
                                </Button>
                             </Tooltip>
                          )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      
      <RegisterBatteryModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onRegistered={handleRegisterSuccess} />
    </div>
  );
}