import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dispatchService, inventoryService, batteryService } from '../services/api';
import { eolQaService } from '../services/eolQaService';
import { DispatchOrder, DispatchStatus, Battery, InventoryStatus, CustodyStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input, Tooltip } from '../components/ui/design-system';
// Added Box and ShieldCheck to imports to fix undefined icon errors
import { ArrowLeft, Truck, Plus, FileText, CheckCircle, Trash2, Printer, Send, Loader2, AlertTriangle, Search, CheckSquare, Square, ClipboardList, Info, MapPin, Box, ShieldCheck } from 'lucide-react';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

const BatteryPickerModal = ({ isOpen, onClose, onAdd, alreadySelectedIds }: any) => {
    const [available, setAvailable] = useState<Battery[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            Promise.all([
                inventoryService.getInventory(),
                eolQaService.getDispatchEligiblePacks()
            ]).then(([inventoryData, eligiblePacks]) => {
                const eligibleIds = new Set(eligiblePacks.map(p => p.id));
                const valid = inventoryData.filter(b => 
                    !alreadySelectedIds.includes(b.id) && 
                    (b.inventoryStatus === InventoryStatus.AVAILABLE || b.inventoryStatus === InventoryStatus.RESERVED) &&
                    (eligibleIds.has(b.id) || b.eolResult === 'PASS')
                );
                setAvailable(valid);
                setLoading(false);
            });
        } else {
            setSelected([]);
            setSearchTerm('');
        }
    }, [isOpen, alreadySelectedIds]);

    if (!isOpen) return null;

    const filtered = available.filter(b => 
        b.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Add Packs to Dispatch</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by SN..." 
                            className="pl-9 h-9" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Ready</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 opacity-20" /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No eligible batteries available for dispatch.</TableCell></TableRow>
                            ) : (
                                filtered.map(b => (
                                    <TableRow key={b.id} className="cursor-pointer" onClick={() => toggleSelect(b.id)}>
                                        <TableCell>
                                            <input type="checkbox" checked={selected.includes(b.id)} readOnly className="rounded border-slate-300" />
                                        </TableCell>
                                        <TableCell className="font-mono font-bold">{b.serialNumber}</TableCell>
                                        <TableCell className="text-xs">{b.batchId}</TableCell>
                                        <TableCell>
                                            {workflowGuardrails.isBatteryDispatchReady(b).allowed ? <Badge variant="success">READY</Badge> : <Badge variant="outline">QA REQ</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </Table>
                </CardContent>
                <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onAdd(selected)} disabled={selected.length === 0}>
                        Add {selected.length} Selected
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export function DispatchDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { currentRole, currentCluster, addNotification } = useAppStore();
    
    const [order, setOrder] = useState<DispatchOrder | null>(null);
    const [batteries, setBatteries] = useState<Battery[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const isSuperAdmin = currentCluster?.id === 'CS';
    const isLogistics = currentCluster?.id === 'C6' || isSuperAdmin;
    const canManageOrder = isLogistics && order?.status !== DispatchStatus.DISPATCHED;

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    useEffect(() => {
        if (orderId) loadData();
    }, [orderId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await dispatchService.getOrderById(orderId!);
            if (data) {
                setOrder(data);
                const batts = await Promise.all(data.batteryIds.map(id => batteryService.getBatteryById(id)));
                setBatteries(batts.filter(b => !!b) as Battery[]);
            }
        } catch (e) {
            addNotification({ title: 'Error', message: 'Failed to load order.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddBatteries = async (ids: string[]) => {
        if (!order) return;
        setProcessing(true);
        try {
            await dispatchService.addBatteries(order.id, ids, userLabel);
            addNotification({ title: 'Added', message: `${ids.length} batteries added to order.`, type: 'success' });
            setIsPickerOpen(false);
            await loadData();
        } catch (e: any) {
            addNotification({ title: 'Error', message: e.message, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveBattery = async (id: string) => {
        if (!order || !window.confirm("Remove this unit from the order?")) return;
        setProcessing(true);
        try {
            await dispatchService.removeBattery(order.id, id, userLabel);
            addNotification({ title: 'Removed', message: 'Battery removed from order.', type: 'info' });
            await loadData();
        } catch (e: any) {
            addNotification({ title: 'Error', message: e.message, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleGenerateDoc = async (type: 'packing' | 'manifest' | 'invoice') => {
        if (!order) return;
        setProcessing(true);
        try {
            await dispatchService.generateDocument(order.id, type, userLabel);
            addNotification({ title: 'Document Generated', message: `${type.replace(/^\w/, c => c.toUpperCase())} ready.`, type: 'success' });
            await loadData();
        } finally {
            setProcessing(false);
        }
    };

    const handleDispatch = async () => {
        if (!order || !window.confirm("Confirm final dispatch? All units will be marked In-Transit.")) return;
        setProcessing(true);
        try {
            await dispatchService.markDispatched(order.id, userLabel);
            addNotification({ title: 'Dispatched', message: 'Order sent. Inventory levels adjusted.', type: 'success' });
            await loadData();
        } catch (e: any) {
            addNotification({ title: 'Dispatch Failed', message: e.message, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateOrder = async (field: keyof DispatchOrder, val: any) => {
        if (!order) return;
        try {
            await dispatchService.updateOrder(order.id, { [field]: val }, userLabel);
            await loadData();
        } catch (e) {}
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing logistics ledger...</div>;
    if (!order) return <div className="p-20 text-center">Order not found.</div>;

    // Fixed: Define clusterId to resolve the 'Cannot find name clusterId' error
    const clusterId = currentCluster?.id || '';
    const guards = workflowGuardrails.getDispatchGuardrail(order, batteries, clusterId);
    const isDispatched = order.status === DispatchStatus.DISPATCHED;
    
    const checklist = [
        { label: 'Batteries Selected', status: order.batteryIds.length > 0 ? 'DONE' : 'PENDING', icon: Box },
        { label: 'Compliance Pass', status: (order.batteryIds.length > 0 && batteries.every(b => workflowGuardrails.isBatteryDispatchReady(b).allowed)) ? 'DONE' : 'PENDING', icon: ShieldCheck },
        { label: 'Documents Ready', status: (order.packingListRef && order.manifestRef) ? 'DONE' : 'PENDING', icon: FileText },
        { label: 'Transport Bound', status: order.vehicleNumber ? 'DONE' : 'PENDING', icon: Truck }
    ];

    return (
        <div className="pb-12">
            <StageHeader 
                stageCode={isDispatched ? "S12" : "S11"}
                title={isDispatched ? "Dispatch Execution & Custody Transfer" : "Dispatch Planning & Authorization"}
                objective={isDispatched ? "Formal handover of certified assets to transport carrier." : "Configure shipment manifests and verify asset compliance."}
                entityLabel={order.orderNumber}
                status={order.status}
                diagnostics={{ route: '/dispatch', entityId: order.id }}
            />

            <div className="max-w-7xl mx-auto px-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dispatch')} className="gap-2 text-slate-500">
                        <ArrowLeft className="h-4 w-4" /> Back to Queue
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <NextStepsPanel entity={order} type="DISPATCH" />

                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30">
                                <CardTitle className="text-base flex items-center gap-2"><CheckSquare size={18} className="text-primary"/> S11 Dispatch Checklist</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {checklist.map((item, i) => (
                                        <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${item.status === 'DONE' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                            <div className={`${item.status === 'DONE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                <item.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{item.status}</p>
                                                <p className="text-xs font-bold leading-tight">{item.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Customer</p>
                                        <p className="font-bold">{order.customerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Est. Ship Date</p>
                                        <p className="font-bold">{order.expectedShipDate}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Destination</p>
                                        <p className="font-bold flex items-center gap-1"><MapPin size={12} className="text-slate-400"/> {order.destinationAddress}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-base">Transport Information</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Vehicle Number</label>
                                        <Input disabled={isDispatched} value={order.vehicleNumber || ''} onChange={e => handleUpdateOrder('vehicleNumber', e.target.value)} placeholder="e.g. KA-01-AB-1234" className="font-mono h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Carrier Name</label>
                                        <Input disabled={isDispatched} value={order.carrierName || ''} onChange={e => handleUpdateOrder('carrierName', e.target.value)} placeholder="e.g. BlueDart" className="h-9" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Shipment Contents</CardTitle>
                                {canManageOrder && (
                                    <Button size="sm" variant="outline" onClick={() => setIsPickerOpen(true)} className="h-8">
                                        <Plus className="h-4 w-4 mr-2" /> Add Packs
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                        <TableRow>
                                            <TableHead>Serial Number</TableHead>
                                            <TableHead>Batch</TableHead>
                                            <TableHead>Compliance</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <tbody>
                                        {batteries.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 italic text-sm">No batteries added to this shipment manifest.</TableCell></TableRow>
                                        ) : (
                                            batteries.map(b => {
                                                const ready = workflowGuardrails.isBatteryDispatchReady(b);
                                                return (
                                                    <TableRow key={b.id}>
                                                        <TableCell className="font-mono font-bold text-primary">{b.serialNumber}</TableCell>
                                                        <TableCell className="text-xs">{b.batchId}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={ready.allowed ? "success" : "outline"} className="text-[9px]">
                                                                {ready.allowed ? "PASSED" : "FAILED"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {canManageOrder && (
                                                                <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50" onClick={() => handleRemoveBattery(b.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
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

                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white border-none shadow-xl">
                            <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-sm uppercase tracking-wider text-slate-400">Execution Hub</CardTitle></CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <ActionGuard 
                                    guard={guards.authorize} 
                                    onClick={handleDispatch} 
                                    label="Authorize Dispatch" 
                                    icon={Send} 
                                    loading={processing}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-xl shadow-indigo-500/30"
                                    actionName="Authorize_Dispatch_S11"
                                    entityId={order.id}
                                />
                                <div className="p-3 bg-slate-800/50 rounded-xl space-y-2 border border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signatures</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Logistics Auth</span>
                                        {isLogistics ? <CheckCircle size={14} className="text-emerald-500" /> : <Square size={14} className="text-slate-700" />}
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">QA Pass-Through</span>
                                        {batteries.every(b => b.eolResult === 'PASS') ? <CheckCircle size={14} className="text-emerald-500" /> : <Square size={14} className="text-slate-700" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Documents</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 group">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span className="text-[10px] font-bold">Packing List</span>
                                    </div>
                                    {order.packingListRef ? <Printer size={12} className="opacity-40 group-hover:opacity-100 cursor-pointer"/> : <Button variant="ghost" className="h-6 px-2 text-[8px]" onClick={() => handleGenerateDoc('packing')}>GEN</Button>}
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 group">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-indigo-500" />
                                        <span className="text-[10px] font-bold">Manifest</span>
                                    </div>
                                    {order.manifestRef ? <Printer size={12} className="opacity-40 group-hover:opacity-100 cursor-pointer"/> : <Button variant="ghost" className="h-6 px-2 text-[8px]" onClick={() => handleGenerateDoc('manifest')}>GEN</Button>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <BatteryPickerModal 
                isOpen={isPickerOpen} 
                onClose={() => setIsPickerOpen(false)} 
                onAdd={handleAddBatteries} 
                alreadySelectedIds={order.batteryIds}
            />
        </div>
    );
}

export default DispatchDetail;