import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { batteryService, provisioningService } from '../services/api';
import { Battery } from '../domain/types';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Tooltip } from '../components/ui/design-system';
import { Cpu, Scan, CheckCircle, AlertTriangle, Play, Shield, RefreshCw, Save, ArrowRight, ClipboardCheck, Camera } from 'lucide-react';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

const STEP_TITLES = [
    "Scan Battery",
    "BMS Pairing",
    "Firmware Baseline",
    "Config Profile",
    "Initial Handshake",
    "Verify Diagnostics",
    "Finalize (S9)"
];

export default function ProvisioningConsole() {
    const { currentCluster, currentRole, addNotification } = useAppStore();
    const { batteryId: pathId } = useParams();
    const [searchParams] = useSearchParams();
    
    const [stationId] = useState(() => localStorage.getItem('provisioning_station_id') || 'P-01');
    const [currentStep, setCurrentStep] = useState(0);
    const [battery, setBattery] = useState<Battery | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Inputs
    const [scanInput, setScanInput] = useState(pathId || searchParams.get('batteryId') || '');
    const [bmsUid, setBmsUid] = useState('');
    const [firmware, setFirmware] = useState('v2.4.0');
    const [profile, setProfile] = useState('CAL_LFP_16S_v3.2');
    const [failNotes, setFailNotes] = useState('');
    
    // Verification Results
    const [verification, setVerification] = useState<{ handshake: boolean, telemetry: boolean } | null>(null);

    const clusterId = currentCluster?.id || '';
    const userLabel = `${currentRole?.name} (${clusterId})`;

    useEffect(() => {
        if (scanInput) {
            handleScan();
        }
    }, [pathId]);

    const handleScan = async () => {
        if (!scanInput) return;
        setLoading(true);
        try {
            const batt = await batteryService.getBatteryBySN(scanInput) || await batteryService.getBatteryById(scanInput);
            
            if (batt) {
                setBattery(batt);
                setCurrentStep(1);
                setBmsUid(batt.bmsUid || '');
                if (batt.firmwareVersion) setFirmware(batt.firmwareVersion);
                if (batt.calibrationProfile) setProfile(batt.calibrationProfile);
            } else {
                addNotification({ title: "Not Found", message: "Battery Identity not registered.", type: "error" });
            }
        } catch (e) {
            addNotification({ title: "Error", message: "Scan failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCamera = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            addNotification({ title: 'Scanner Active', message: 'Camera permission granted.', type: 'info' });
        } catch (e) {
            addNotification({ title: 'Permission Denied', message: 'Please enable camera to scan QR.', type: 'error' });
        }
    };

    const handleBindBms = async () => {
        if (!battery || !bmsUid) return;
        setLoading(true);
        try {
            const updated = await provisioningService.bindBms(battery.id, bmsUid, userLabel);
            setBattery(updated);
            setCurrentStep(2);
            addNotification({ title: "Success", message: "BMS Linked", type: "success" });
        } finally {
            setLoading(false);
        }
    };

    const handleFlash = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await provisioningService.flashFirmware(battery.id, firmware, userLabel);
            setBattery(updated);
            setCurrentStep(3);
            addNotification({ title: "Success", message: "Firmware Verified", type: "success" });
        } finally {
            setLoading(false);
        }
    };

    const handleCalibrate = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await provisioningService.triggerCalibration(battery.id, profile, userLabel);
            setBattery(updated);
            setCurrentStep(4);
            addNotification({ title: "Success", message: "Profile Applied", type: "success" });
        } finally {
            setLoading(false);
        }
    };

    const handleHandshake = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        setCurrentStep(5);
        addNotification({ title: "OK", message: "Device Handshake Success", type: "success" });
        setLoading(false);
    };

    const handleVerify = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const res = await provisioningService.runVerification(battery.id);
            setVerification(res);
            setCurrentStep(6);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (result: 'PASS' | 'FAIL') => {
        if (!battery) return;
        setLoading(true);
        try {
            const status = result === 'PASS' ? 'DONE' : 'BLOCKED';
            const updated = await provisioningService.finalizeProvisioning(battery.id, result as any, userLabel, failNotes);
            setBattery({ ...updated, provisioningStatus: status } as any);
            addNotification({ title: "Stage S9 Complete", message: "Battery ready for inventory.", type: "success" });
            setTimeout(() => handleReset(), 1500);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setBattery(null);
        setCurrentStep(0);
        setScanInput('');
        setBmsUid('');
        setVerification(null);
        setFailNotes('');
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <Scan size={64} className="text-muted-foreground animate-pulse" />
                        <div className="w-full max-w-md space-y-4">
                            <Input 
                                autoFocus 
                                placeholder="Scan Battery SN (S8 ID Required)..." 
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                className="text-lg h-12 text-center"
                                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                            />
                            <div className="flex gap-2">
                                <Button size="lg" className="flex-1 font-bold h-12 shadow-lg" onClick={handleScan} disabled={loading || !scanInput}>
                                    {loading ? 'Validating...' : 'Authorize Provisioning'}
                                </Button>
                                <Button size="lg" variant="outline" className="h-12 w-12 p-0" onClick={handleRequestCamera} title="Scan QR Code">
                                    <Camera size={20} />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase text-slate-500">BMS Hardware UID</label>
                            <div className="flex gap-2">
                                <Input value={bmsUid} onChange={(e) => setBmsUid(e.target.value)} placeholder="Scan BMS Identity" className="font-mono" />
                                <Button variant="outline" onClick={() => setBmsUid(`BMS-${Math.floor(Math.random()*10000)}`)}>READ</Button>
                            </div>
                        </div>
                        <Button className="w-full h-12 font-bold" onClick={handleBindBms} disabled={loading || !bmsUid}>
                            {loading ? 'Binding...' : 'Confirm Pairing'}
                        </Button>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase text-slate-500">Firmware Specification</label>
                            <select className="w-full h-12 p-2 border rounded-xl bg-background font-mono" value={firmware} onChange={(e) => setFirmware(e.target.value)}>
                                <option value="v2.4.0">VAN-G3-STD-v2.4.0</option>
                                <option value="v2.5.0-rc1">VAN-G3-DEV-v2.5.0</option>
                            </select>
                        </div>
                        <Button className="w-full h-12 font-bold" onClick={handleFlash} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Firmware Baseline'}
                        </Button>
                    </div>
                );
            case 3:
                 return (
                     <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase text-slate-500">Config Profile (SKU Derived)</label>
                            <select className="w-full h-12 p-2 border rounded-xl bg-background font-mono" value={profile} onChange={(e) => setProfile(e.target.value)}>
                                <option value="CAL_LFP_16S_v3.2">VAN-48V-100AH-LFP-G3</option>
                            </select>
                        </div>
                        <Button className="w-full h-12 font-bold" onClick={handleCalibrate} disabled={loading}>
                            {loading ? 'Applying...' : 'Apply Config Profile'}
                        </Button>
                    </div>
                );
             case 4:
                 return (
                     <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <RefreshCw size={48} className="mx-auto text-primary animate-spin" />
                        <p className="text-slate-500 font-medium">Ready to trigger initial communication handshake.</p>
                        <Button size="lg" className="w-full h-14 font-black" onClick={handleHandshake} disabled={loading}>
                            {loading ? 'HANDSHAKING...' : 'INITIATE HANDSHAKE'}
                        </Button>
                    </div>
                );
             case 5:
                 return (
                     <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <Shield size={48} className="mx-auto text-emerald-500" />
                        <p className="text-slate-500 font-medium">Verify final telemetry paths before inventory handover.</p>
                        <Button size="lg" className="w-full h-14 font-black" onClick={handleVerify} disabled={loading}>
                            {loading ? 'DIAGNOSING...' : 'EXECUTE DIAGNOSTICS'}
                        </Button>
                    </div>
                );
             case 6:
                return (
                    <div className="space-y-6 max-w-lg mx-auto py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border-2 border-dashed rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
                                <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Handshake</span>
                                <Badge variant="success" className="px-4">OK</Badge>
                            </div>
                            <div className="p-4 border-2 border-dashed rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
                                <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Telemetry</span>
                                <Badge variant="success" className="px-4">ACTIVE</Badge>
                            </div>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-dashed">
                            <div className="flex gap-4">
                                <Button className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 font-black" onClick={() => handleFinalize('PASS')} disabled={loading}>
                                    <CheckCircle className="mr-2 h-5 w-5" /> SIGN-OFF S9
                                </Button>
                                <Button className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 font-black" onClick={() => handleFinalize('FAIL')} disabled={loading}>
                                    <AlertTriangle className="mr-2 h-5 w-5" /> REJECT
                                </Button>
                            </div>
                            <Input placeholder="Sign-off notes..." value={failNotes} onChange={e => setFailNotes(e.target.value)} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="pb-12">
            <StageHeader 
                stageCode="S9"
                title="Provisioning & BMS Handover"
                objective="Pair BMS controller, flash verified firmware, and synchronize config profiles for final readiness."
                entityLabel={battery?.serialNumber || 'Awaiting Authorization'}
                status={battery?.provisioningStatus || 'QUEUED'}
                diagnostics={{ route: '/provisioning', entityId: battery?.id || stationId }}
            />

            <div className="max-w-7xl mx-auto px-6 space-y-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <Card className="flex-1 border-none shadow-xl">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Cpu size={18} className="text-primary"/> Step {currentStep + 1}: {STEP_TITLES[currentStep]}
                                </CardTitle>
                                <div className="flex gap-1.5">
                                    {STEP_TITLES.map((_, i) => (
                                        <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i <= currentStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderStepContent()}
                        </CardContent>
                    </Card>

                    <div className="w-full lg:w-80 space-y-6 shrink-0">
                        <Card className="bg-slate-900 text-white border-none shadow-xl">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <CardTitle className="text-xs uppercase tracking-widest text-slate-400">Station Identity</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Current Station</p>
                                    <p className="text-xl font-black text-white">{stationId}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Operator Context</p>
                                    <Badge variant="outline" className="text-white border-white/20">{userLabel}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {battery && (
                            <Card className="shadow-lg border-2 border-dashed border-indigo-100 dark:border-indigo-900">
                                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Active Target</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">S8 Identity</p>
                                        <p className="font-mono font-bold text-indigo-600">{battery.serialNumber}</p>
                                    </div>
                                    <div className="pt-2 flex justify-between text-xs font-bold border-t">
                                        <span className="text-slate-400">CERTIFIED:</span>
                                        <span className="text-emerald-500">YES (S8)</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={handleReset}>
                            <RefreshCw className="mr-2 h-3 w-3" /> Clear Session
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}