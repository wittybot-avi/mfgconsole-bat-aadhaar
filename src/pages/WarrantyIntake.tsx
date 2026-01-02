import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { warrantyService } from '../services/warrantyService';
import { batteryService } from '../services/api';
import { Battery, FailureCategory, ClaimPriority } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui/design-system';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function WarrantyIntake() {
    const navigate = useNavigate();
    const { currentCluster, currentRole, addNotification } = useAppStore();
    
    const [eligibleBatteries, setEligibleBatteries] = useState<Battery[]>([]);
    const [selectedBatteryId, setSelectedBatteryId] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [category, setCategory] = useState<FailureCategory>(FailureCategory.FIELD_MISUSE);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    useEffect(() => {
        loadEligible();
    }, []);

    const loadEligible = async () => {
        setLoading(true);
        // Mock: assume current user maps to a customer name "Customer A" for demo
        const list = await warrantyService.getEligibleBatteriesForCustomer('Customer A');
        setEligibleBatteries(list);
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!selectedBatteryId || !symptoms) return;
        setSubmitting(true);
        try {
            const claim = await warrantyService.createClaim({
                batteryId: selectedBatteryId,
                symptoms,
                failureCategory: category,
                priority: ClaimPriority.MEDIUM,
                customerName: 'Customer A (Simulated)'
            }, { 
                role: currentRole?.name || 'External', 
                user: currentRole?.name || 'External', 
                cluster: currentCluster?.id || '' 
            });
            
            addNotification({ title: "Submitted", message: `Claim ${claim.claimId} created successfully.`, type: "success" });
            navigate(`/warranty/claims/${claim.claimId}`);
        } catch (e: any) {
            addNotification({ title: "Error", message: e.message || "Failed to submit claim", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/warranty')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Submit Warranty Claim</h2>
                    <p className="text-muted-foreground text-sm">Report a technical issue with a received battery.</p>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>Claim Details</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* Eligibility Warning */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900 flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p>Claims can only be raised for batteries that have been formally accepted. If a battery is missing from this list, please check its Custody status.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Asset</label>
                        <select 
                            className="w-full p-2 border rounded bg-background" 
                            value={selectedBatteryId} 
                            onChange={e => setSelectedBatteryId(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Select a battery...</option>
                            {eligibleBatteries.map(b => (
                                <option key={b.id} value={b.id}>{b.serialNumber} (Batch {b.batchId})</option>
                            ))}
                        </select>
                        {loading && <p className="text-xs text-muted-foreground">Loading assets...</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Issue Category</label>
                        <select 
                            className="w-full p-2 border rounded bg-background" 
                            value={category} 
                            onChange={e => setCategory(e.target.value as FailureCategory)}
                        >
                            <option value={FailureCategory.FIELD_MISUSE}>Field Issue / Misuse</option>
                            <option value={FailureCategory.AGING_WEAR}>Aging / Wear</option>
                            <option value={FailureCategory.LOGISTICS_DAMAGE}>Shipping Damage</option>
                            <option value={FailureCategory.UNKNOWN}>Other / Unknown</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Symptoms / Description</label>
                        <textarea 
                            className="w-full min-h-[120px] p-2 border rounded bg-background text-sm" 
                            value={symptoms} 
                            onChange={e => setSymptoms(e.target.value)} 
                            placeholder="Describe the failure, error codes, or physical damage..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => navigate('/warranty')}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting || !selectedBatteryId || !symptoms}>
                            {submitting ? 'Submitting...' : 'Submit Claim'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}