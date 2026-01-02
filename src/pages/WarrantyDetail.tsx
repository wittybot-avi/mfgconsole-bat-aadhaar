
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { warrantyService } from '../services/warrantyService';
import { WarrantyClaim, ClaimStatus, ClaimDisposition, LiabilityAttribution, FailureCategory, ClaimPriority } from '../domain/types';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, FileText, Activity, AlertTriangle, CheckCircle, Save, Paperclip, Truck, Box } from 'lucide-react';

const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase">{label}</span>
        <span className="font-medium text-sm">{value || '-'}</span>
    </div>
);

export default function WarrantyDetail() {
    const { claimId } = useParams();
    const navigate = useNavigate();
    const { currentCluster, currentRole, addNotification } = useAppStore();
    
    const [claim, setClaim] = useState<WarrantyClaim | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');
    const [processing, setProcessing] = useState(false);

    // Form States
    const [analystNotes, setAnalystNotes] = useState('');
    const [suspectedCause, setSuspectedCause] = useState<FailureCategory>(FailureCategory.UNKNOWN);
    const [disposition, setDisposition] = useState<ClaimDisposition>(ClaimDisposition.REPAIR);
    const [liability, setLiability] = useState<LiabilityAttribution>(LiabilityAttribution.UNKNOWN);
    const [decisionNotes, setDecisionNotes] = useState('');
    const [closureNotes, setClosureNotes] = useState('');

    // RBAC
    const canUpdate = canDo(currentCluster?.id || '', ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL, 'E');
    const canDecide = canDo(currentCluster?.id || '', ScreenId.WARRANTY_DECIDE_DISPOSITION, 'A');
    const canClose = canDo(currentCluster?.id || '', ScreenId.WARRANTY_CLOSE_CLAIM, 'X');
    const isExternal = currentCluster?.id === 'C9';

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    useEffect(() => {
        if (claimId) loadClaim(claimId);
    }, [claimId]);

    const loadClaim = async (id: string) => {
        setLoading(true);
        const data = await warrantyService.getClaim(id);
        if (!data) {
            addNotification({ title: "Error", message: "Claim not found", type: "error" });
            navigate('/warranty');
            return;
        }
        setClaim(data);
        
        // Init form state
        if (data.rca) {
            setAnalystNotes(data.rca.analystNotes);
            setSuspectedCause(data.rca.suspectedCause);
        }
        if (data.decisionNotes) setDecisionNotes(data.decisionNotes);
        if (data.disposition) setDisposition(data.disposition);
        if (data.liabilityAttribution) setLiability(data.liabilityAttribution);
        if (data.closureNotes) setClosureNotes(data.closureNotes);

        setLoading(false);
    };

    const handleUpdateRCA = async () => {
        if (!claim) return;
        setProcessing(true);
        try {
            await warrantyService.updateClaim(claim.claimId, {
                status: ClaimStatus.UNDER_ANALYSIS,
                rca: {
                    suspectedCause,
                    contributingFactors: [],
                    analystNotes,
                    analyzedAt: new Date().toISOString(),
                    analyzedBy: userLabel
                }
            }, { user: userLabel });
            addNotification({ title: "Updated", message: "RCA details saved.", type: "success" });
            loadClaim(claim.claimId);
        } catch (e) {
            addNotification({ title: "Error", message: "Save failed.", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    const handleDecide = async () => {
        if (!claim) return;
        setProcessing(true);
        try {
            await warrantyService.decideDisposition(claim.claimId, {
                disposition,
                liability,
                notes: decisionNotes
            }, { user: userLabel });
            addNotification({ title: "Decided", message: "Disposition confirmed.", type: "success" });
            loadClaim(claim.claimId);
        } catch (e) {
            addNotification({ title: "Error", message: "Decision failed.", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = async () => {
        if (!claim) return;
        setProcessing(true);
        try {
            await warrantyService.closeClaim(claim.claimId, closureNotes, { user: userLabel });
            addNotification({ title: "Closed", message: "Claim closed successfully.", type: "success" });
            loadClaim(claim.claimId);
        } catch (e) {
            addNotification({ title: "Error", message: "Close failed.", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !claim) return <div className="p-10 text-center">Loading claim details...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/warranty')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {claim.claimId}
                        <Badge variant={
                            claim.status === ClaimStatus.OPEN ? 'destructive' :
                            claim.status === ClaimStatus.CLOSED ? 'success' : 'secondary'
                        }>
                            {claim.status}
                        </Badge>
                    </h2>
                    <p className="text-muted-foreground text-sm">Battery: {claim.batteryId} • Customer: {claim.customerName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Details & Evidence */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Claim Summary</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoRow label="Priority" value={claim.priority} />
                            <InfoRow label="Category" value={claim.failureCategory} />
                            <InfoRow label="Reported" value={new Date(claim.reportedAt).toLocaleDateString()} />
                            <InfoRow label="Created By" value={`${claim.createdByName} (${claim.createdByRole})`} />
                            <div className="col-span-2 md:col-span-4 mt-2">
                                <InfoRow label="Symptoms" value={claim.symptoms} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evidence & References */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Linked Evidence</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-xs font-bold">Telemetry</p>
                                        <p className="text-xs text-muted-foreground">Last SoC: 45% | Max T: 32°C</p>
                                    </div>
                                </div>
                                <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
                                    <Box className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <p className="text-xs font-bold">Custody</p>
                                        <p className="text-xs text-muted-foreground">Accepted by Customer</p>
                                    </div>
                                </div>
                                <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
                                    <Truck className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <p className="text-xs font-bold">Dispatch</p>
                                        <p className="text-xs text-muted-foreground">{claim.batchId ? `Batch ${claim.batchId}` : 'No Batch Info'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">Attachments</h4>
                                {claim.evidenceAttachments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No files attached.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {/* Fix: Explicitly type attachment to avoid Key error */}
                                        {claim.evidenceAttachments.map((att: { id: string, fileName: string, type: string }) => (
                                            <li key={att.id} className="text-sm flex items-center gap-2">
                                                <Paperclip className="h-4 w-4" /> {att.fileName} <span className="text-xs text-muted-foreground">({att.type})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {canUpdate && (
                                    <Button variant="outline" size="sm" className="mt-2" onClick={() => addNotification({title: "Upload", message: "File upload mock triggered", type: "info"})}>
                                        Upload Evidence
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* RCA Workspace (Internal Only) */}
                    {!isExternal && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Root Cause Analysis (RCA)</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {claim.status === ClaimStatus.DECIDED || claim.status === ClaimStatus.CLOSED ? (
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded text-sm">
                                        <InfoRow label="Suspected Cause" value={claim.rca?.suspectedCause} />
                                        <InfoRow label="Analyst Notes" value={claim.rca?.analystNotes} />
                                        <div className="text-xs text-muted-foreground mt-2">Analyzed by {claim.rca?.analyzedBy} on {new Date(claim.rca?.analyzedAt || '').toLocaleDateString()}</div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Suspected Cause</label>
                                                <select className="w-full p-2 border rounded bg-background text-sm" value={suspectedCause} onChange={e => setSuspectedCause(e.target.value as FailureCategory)} disabled={!canUpdate}>
                                                    {Object.values(FailureCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Analysis Notes</label>
                                            <textarea className="w-full min-h-[100px] p-2 border rounded bg-background text-sm" value={analystNotes} onChange={e => setAnalystNotes(e.target.value)} disabled={!canUpdate} />
                                        </div>
                                        {canUpdate && <Button onClick={handleUpdateRCA} disabled={processing}>Save Analysis</Button>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Workflow Actions */}
                <div className="space-y-6">
                    {/* Disposition */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Disposition & Liability</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {claim.status === ClaimStatus.DECIDED || claim.status === ClaimStatus.CLOSED ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-100 dark:border-emerald-800">
                                        <InfoRow label="Disposition" value={claim.disposition} />
                                    </div>
                                    {!isExternal && <InfoRow label="Liability" value={claim.liabilityAttribution} />}
                                    <InfoRow label="Decision Notes" value={claim.decisionNotes} />
                                </div>
                            ) : (
                                !isExternal ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Disposition</label>
                                            <select className="w-full p-2 border rounded bg-background text-sm" value={disposition} onChange={e => setDisposition(e.target.value as ClaimDisposition)} disabled={!canDecide}>
                                                {Object.values(ClaimDisposition).map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Liability Attribution</label>
                                            <select className="w-full p-2 border rounded bg-background text-sm" value={liability} onChange={e => setLiability(e.target.value as LiabilityAttribution)} disabled={!canDecide}>
                                                {Object.values(LiabilityAttribution).map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Decision Rationale</label>
                                            <Input value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} disabled={!canDecide} />
                                        </div>
                                        {canDecide && (
                                            <Button className="w-full" onClick={handleDecide} disabled={processing}>Confirm Decision</Button>
                                        )}
                                        {!canDecide && <p className="text-xs text-center text-muted-foreground">Awaiting decision from Warranty Mgr.</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center">Status: {claim.status}</p>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Closure */}
                    {claim.status === ClaimStatus.DECIDED && !isExternal && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Closure</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Closure Notes</label>
                                    <textarea className="w-full min-h-[80px] p-2 border rounded bg-background text-sm" value={closureNotes} onChange={e => setClosureNotes(e.target.value)} disabled={!canClose} />
                                </div>
                                {canClose && (
                                    <Button className="w-full" variant="outline" onClick={handleClose} disabled={!closureNotes || processing}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Close Claim
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {claim.status === ClaimStatus.CLOSED && (
                        <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-80" />
                                <h3 className="font-semibold text-foreground">Claim Closed</h3>
                                <p className="text-xs mt-1">{new Date(claim.closedAt || '').toLocaleDateString()}</p>
                                <p className="text-sm mt-2">{claim.closureNotes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
