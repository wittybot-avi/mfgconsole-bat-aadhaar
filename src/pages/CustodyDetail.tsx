import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { custodyService } from '../services/custodyService';
import { DispatchOrder, Battery, CustodyStatus } from '../domain/types';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Truck, MapPin, Calendar, CheckCircle, XCircle, Box, UserCheck, AlertTriangle } from 'lucide-react';

const ActionModal = ({ isOpen, title, onClose, onConfirm, loading, type }: any) => {
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState('');
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[500px] shadow-xl border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <div className="space-y-4">
                    {type === 'receive' && (
                        <div>
                            <label className="text-sm font-medium">Receiving Location</label>
                            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Warehouse A, Dock 2" />
                        </div>
                    )}
                    {type === 'reject' && (
                        <div>
                            <label className="text-sm font-medium">Reason Code</label>
                            <select className="w-full p-2 border rounded bg-background" value={reason} onChange={e => setReason(e.target.value)}>
                                <option value="">Select Reason...</option>
                                <option value="DAMAGED">Physical Damage</option>
                                <option value="WRONG_ITEM">Wrong Item</option>
                                <option value="DOCS_MISSING">Missing Documents</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium">Notes / Remarks</label>
                        <textarea 
                            className="w-full min-h-[80px] p-2 border rounded bg-background text-sm" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="Enter details..."
                        />
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded text-xs text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>This action will be permanently recorded in the immutable audit log.</span>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        disabled={loading || (type === 'receive' && !location) || (type === 'reject' && !reason)} 
                        onClick={() => onConfirm({ notes, location, reason })}
                        className={type === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : type === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                        {loading ? 'Processing...' : 'Confirm'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function CustodyDetail() {
    const { dispatchId } = useParams();
    const navigate = useNavigate();
    const { currentCluster, currentRole, addNotification } = useAppStore();
    
    const [order, setOrder] = useState<DispatchOrder | null>(null);
    const [batteries, setBatteries] = useState<Battery[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    
    // Action State
    const [modalType, setModalType] = useState<'receive' | 'accept' | 'reject' | null>(null);

    // RBAC
    const canReceive = canDo(currentCluster?.id || '', ScreenId.CUSTODY_RECEIVE_ACTION, 'X');
    const canAcceptReject = canDo(currentCluster?.id || '', ScreenId.CUSTODY_ACCEPT_REJECT_ACTION, 'X');

    useEffect(() => {
        if (dispatchId) loadData();
    }, [dispatchId]);

    const loadData = async () => {
        setLoading(true);
        if (dispatchId) {
            const o = await custodyService.getShipment(dispatchId);
            const b = await custodyService.getShipmentBatteries(dispatchId);
            setOrder(o || null);
            setBatteries(b);
        }
        setLoading(false);
    };

    const handleAction = async (data: any) => {
        if (!order || !modalType) return;
        setProcessing(true);
        const userLabel = `${currentRole?.name} (${currentCluster?.id})`;
        
        try {
            if (modalType === 'receive') {
                await custodyService.markReceived(order.id, data.location, data.notes, userLabel);
                addNotification({ title: "Received", message: "Shipment marked as received.", type: "success" });
            } else if (modalType === 'accept') {
                await custodyService.markAccepted(order.id, data.notes, userLabel);
                addNotification({ title: "Accepted", message: "Custody transfer complete.", type: "success" });
            } else if (modalType === 'reject') {
                await custodyService.markRejected(order.id, data.reason, data.notes, userLabel);
                addNotification({ title: "Rejected", message: "Shipment rejected.", type: "warning" });
            }
            await loadData();
        } catch (e) {
            addNotification({ title: "Error", message: "Action failed.", type: "error" });
        } finally {
            setProcessing(false);
            setModalType(null);
        }
    };

    if (loading || !order) return <div className="p-10 text-center">Loading...</div>;

    // Timeline Construction
    const events = [
        { label: 'Dispatched', date: order.dispatchedAt, user: order.createdBy, icon: Truck, done: !!order.dispatchedAt },
        { label: 'Received', date: order.deliveredAt, user: 'Receiver', icon: MapPin, done: !!order.deliveredAt },
        { label: order.custodyStatus === CustodyStatus.REJECTED ? 'Rejected' : 'Accepted', date: order.acceptedAt || (order.custodyStatus === CustodyStatus.REJECTED ? order.updatedAt : null), user: 'Customer', icon: order.custodyStatus === CustodyStatus.REJECTED ? XCircle : UserCheck, done: order.custodyStatus === CustodyStatus.ACCEPTED || order.custodyStatus === CustodyStatus.REJECTED },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/custody')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {order.orderNumber}
                        <Badge variant={order.custodyStatus === CustodyStatus.ACCEPTED ? 'success' : order.custodyStatus === CustodyStatus.REJECTED ? 'destructive' : 'outline'}>
                            {order.custodyStatus || 'Processing'}
                        </Badge>
                    </h2>
                    <p className="text-muted-foreground text-sm">To: {order.customerName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Details & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Shipment Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Destination:</span> <div className="font-medium">{order.destinationAddress}</div></div>
                            <div><span className="text-muted-foreground">Carrier:</span> <div className="font-medium">{order.carrierName || 'TBD'}</div></div>
                            <div><span className="text-muted-foreground">Expected Date:</span> <div className="font-medium">{order.expectedShipDate}</div></div>
                            <div><span className="text-muted-foreground">Documents:</span> <div className="font-medium">{order.packingListRef ? 'Available' : 'Pending'}</div></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Contents ({batteries.length})</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {batteries.map(b => (
                                    <div key={b.id} className="p-2 border rounded text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                        <span className="font-mono">{b.serialNumber}</span>
                                        <Badge variant="outline" className="text-[10px]">{b.custodyStatus}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Custody Timeline</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 my-2">
                                {events.map((evt, i) => (
                                    <div key={i} className={`relative ${evt.done ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className={`absolute -left-[31px] h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-950 ${evt.done ? 'border-primary text-primary' : 'border-slate-300 text-slate-300'}`}>
                                            <evt.icon className="h-3 w-3" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{evt.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {evt.date ? new Date(evt.date).toLocaleString() : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            
                            {/* Receive Step */}
                            {order.custodyStatus === CustodyStatus.IN_TRANSIT && (
                                <Button 
                                    className="w-full" 
                                    onClick={() => setModalType('receive')} 
                                    disabled={!canReceive}
                                >
                                    <MapPin className="mr-2 h-4 w-4" /> Mark Received
                                </Button>
                            )}

                            {/* Accept/Reject Step */}
                            {order.custodyStatus === CustodyStatus.DELIVERED && (
                                <div className="space-y-2">
                                    <Button 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700" 
                                        onClick={() => setModalType('accept')}
                                        disabled={!canAcceptReject}
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" /> Accept & Sign
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                                        onClick={() => setModalType('reject')}
                                        disabled={!canAcceptReject}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                </div>
                            )}

                            {/* Completed State */}
                            {(order.custodyStatus === CustodyStatus.ACCEPTED || order.custodyStatus === CustodyStatus.REJECTED) && (
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded text-center text-sm text-muted-foreground">
                                    Custody transfer finalized.
                                </div>
                            )}

                            {!canReceive && !canAcceptReject && (
                                <p className="text-xs text-center text-muted-foreground">Read-only view</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ActionModal 
                isOpen={!!modalType} 
                type={modalType}
                title={modalType === 'receive' ? "Receive Shipment" : modalType === 'accept' ? "Accept Custody" : "Reject Shipment"}
                onClose={() => setModalType(null)}
                onConfirm={handleAction}
                loading={processing}
            />
        </div>
    );
}