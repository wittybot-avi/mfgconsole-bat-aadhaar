
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { batteryService, eolService } from '../services/api';
import { Battery, QaDisposition, EolMeasurements } from '../domain/types';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '../components/ui/design-system';
import { Scan, AlertTriangle, CheckCircle, RefreshCw, FileText, Activity, ShieldCheck, Download, Play } from 'lucide-react';

const STEP_TITLES = [
    "Scan Battery",
    "Pre-Check",
    "EOL Test",
    "QA Disposition",
    "Certification",
    "Finalize"
];

export default function EolStation() {
    const { currentCluster, currentRole, addNotification } = useAppStore();
    // Fix: Corrected invalid ScreenId property reference from EOL_QA_STATION to EOL_QA_QUEUE.
    const canExecute = canDo(currentCluster?.id || '', ScreenId.EOL_QA_QUEUE, 'X');
    const isSuperUser = currentCluster?.id === 'CS';

    const [stationId] = useState(() => localStorage.getItem('eol_station_id') || 'EOL-01');
    const [currentStep, setCurrentStep] = useState(0);
    const [battery, setBattery] = useState<Battery | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Inputs
    const [scanInput, setScanInput] = useState('');
    const [disposition, setDisposition] = useState<QaDisposition>(QaDisposition.PASS);
    const [reasonCode, setReasonCode] = useState('');
    const [notes, setNotes] = useState('');

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    const handleScan = async () => {
        if (!scanInput) return;
        setLoading(true);
        try {
            const batt = await batteryService.getBatteryBySN(scanInput) || await batteryService.getBatteryById(scanInput);
            if (batt) {
                setBattery(batt);
                setCurrentStep(1);
            } else {
                addNotification({ title: "Not Found", message: "Battery not found", type: "error" });
            }
        } catch (e) {
            addNotification({ title: "Error", message: "Scan failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handlePreCheck = () => {
        if (!battery) return;
        // Fix: Changed 'PASS' to 'DONE' to correctly align with provisioningStatus enum types
        if (battery.provisioningStatus !== 'DONE' && !isSuperUser) {
            addNotification({ title: "Eligibility Failed", message: "Battery has not passed provisioning.", type: "error" });
            return;
        }
        // Fix: Changed 'PASS' to 'DONE' here as well for consistency with enum types
        if (battery.provisioningStatus !== 'DONE' && isSuperUser) {
             addNotification({ title: "Override", message: "Super User Override: Proceeding despite provisioning status.", type: "warning" });
        }
        setCurrentStep(2);
    };

    const handleRunTest = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await eolService.runEolTest(battery.id, userLabel);
            setBattery(updated);
            setCurrentStep(3);
            addNotification({ title: "Test Complete", message: "Measurements captured", type: "info" });
        } catch (e) {
            addNotification({ title: "Error", message: "Test execution failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDisposition = async () => {
        if (!battery) return;
        if (disposition !== QaDisposition.PASS && !reasonCode) {
            addNotification({ title: "Validation", message: "Reason code required for failure/hold", type: "error" });
            return;
        }
        setLoading(true);
        try {
            const updated = await eolService.setQaDisposition(battery.id, disposition, reasonCode, notes, userLabel);
            setBattery(updated);
            
            if (disposition === QaDisposition.PASS) {
                setCurrentStep(4);
            } else {
                // If failed, skip cert and go to finalize
                setCurrentStep(5); 
            }
            addNotification({ title: "Disposition Set", message: `Marked as ${disposition}`, type: "success" });
        } catch (e) {
             addNotification({ title: "Error", message: "Failed to set disposition", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleCertify = async () => {
         if (!battery) return;
         setLoading(true);
         try {
             const updated = await eolService.generateCertificate(battery.id, userLabel);
             setBattery(updated);
             setCurrentStep(5);
             addNotification({ title: "Certified", message: "Digital Certificate Generated", type: "success" });
         } catch (e) {
             addNotification({ title: "Error", message: "Certification failed", type: "error" });
         } finally {
             setLoading(false);
         }
    };

    const handleFinalize = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            // Fix: changed finalizeQa to finalizeQA (typo fix)
            await eolService.finalizeQA(battery.id, userLabel);
            addNotification({ title: "Finalized", message: "Battery released from station", type: "success" });
            setTimeout(() => {
                if (window.confirm("Process next battery?")) {
                    handleReset();
                }
            }, 500);
        } catch (e) {
            addNotification({ title: "Error", message: "Finalization failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setBattery(null);
        setCurrentStep(0);
        setScanInput('');
        setDisposition(QaDisposition.PASS);
        setReasonCode('');
        setNotes('');
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
                                placeholder="Scan Battery SN or ID..." 
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                className="text-lg h-12 text-center"
                                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                            />
                            <Button size="lg" className="w-full" onClick={handleScan} disabled={loading || !scanInput}>
                                {loading ? 'Scanning...' : 'Load Battery'}
                            </Button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <h3 className="text-lg font-semibold">Eligibility Check</h3>
                        <div className="p-4 border rounded bg-slate-50 dark:bg-slate-800 text-left space-y-2">
                             <div className="flex justify-between">
                                 <span>Provisioning Status:</span>
                                 {/* Fix: Changed comparison value from 'PASS' to 'DONE' to match BatteryProvisioningStatus type values */}
                                 <Badge variant={battery?.provisioningStatus === 'DONE' ? 'success' : 'destructive'}>{battery?.provisioningStatus}</Badge>
                             </div>
                             <div className="flex justify-between">
                                 <span>BMS UID:</span>
                                 <span className="font-mono">{battery?.bmsUid || 'N/A'}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Firmware:</span>
                                 <span className="font-mono">{battery?.firmwareVersion || 'N/A'}</span>
                             </div>
                        </div>
                        <Button className="w-full" onClick={handlePreCheck}>Proceed to Test</Button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="text-center space-y-4">
                            <Activity className="mx-auto h-12 w-12 text-blue-500" />
                            <p>Connect EOL tester and run automated sequence.</p>
                            <Button size="lg" className="w-full" onClick={handleRunTest} disabled={loading || !canExecute}>
                                {loading ? 'Running Test Sequence...' : 'Run EOL Test'}
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                            </div>
                            <Button variant="outline" className="w-full">Upload Test Log (Manual)</Button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 max-w-lg mx-auto py-6">
                         {/* Results Summary */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 border rounded">
                                 <span className="text-xs text-muted-foreground">Voltage</span>
                                 <div className="text-xl font-bold">{battery?.eolMeasurements?.voltage.toFixed(3)} V</div>
                             </div>
                             <div className="p-3 border rounded">
                                 <span className="text-xs text-muted-foreground">Capacity</span>
                                 <div className="text-xl font-bold">{battery?.eolMeasurements?.capacityAh.toFixed(1)} Ah</div>
                             </div>
                             <div className="p-3 border rounded">
                                 <span className="text-xs text-muted-foreground">DC IR</span>
                                 <div className="text-xl font-bold">{battery?.eolMeasurements?.internalResistance.toFixed(1)} mΩ</div>
                             </div>
                             <div className="p-3 border rounded">
                                 <span className="text-xs text-muted-foreground">Temp Max</span>
                                 <div className="text-xl font-bold">{battery?.eolMeasurements?.temperatureMax.toFixed(1)} °C</div>
                             </div>
                         </div>
                         
                         {/* Disposition Form */}
                         <div className="space-y-4 pt-4 border-t">
                             <div className="space-y-2">
                                 <label className="text-sm font-medium">QA Decision</label>
                                 <div className="flex gap-2">
                                     <Button 
                                        variant={disposition === QaDisposition.PASS ? 'default' : 'outline'} 
                                        className={disposition === QaDisposition.PASS ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                        onClick={() => setDisposition(QaDisposition.PASS)}
                                     >
                                         PASS
                                     </Button>
                                     <Button 
                                        variant={disposition === QaDisposition.FAIL ? 'default' : 'outline'} 
                                        className={disposition === QaDisposition.FAIL ? 'bg-rose-600 hover:bg-rose-700' : ''}
                                        onClick={() => setDisposition(QaDisposition.FAIL)}
                                     >
                                         FAIL
                                     </Button>
                                     <Button 
                                        variant={disposition === QaDisposition.HOLD ? 'default' : 'outline'} 
                                        onClick={() => setDisposition(QaDisposition.HOLD)}
                                     >
                                         HOLD
                                     </Button>
                                 </div>
                             </div>
                             
                             {disposition !== QaDisposition.PASS && (
                                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                     <select className="w-full p-2 border rounded bg-background" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                                         <option value="">Select Reason Code...</option>
                                         <option value="VOLTAGE_OUT_OF_RANGE">Voltage Out of Range</option>
                                         <option value="CAPACITY_LOW">Capacity Low</option>
                                         <option value="IR_HIGH">Internal Resistance High</option>
                                         <option value="THERMAL_FAIL">Thermal Runaway / Overheat</option>
                                         <option value="VISUAL_DEFECT">Visual Defect</option>
                                     </select>
                                     <Input placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                 </div>
                             )}

                             <Button className="w-full mt-4" onClick={handleDisposition} disabled={loading || !canExecute}>
                                 {loading ? 'Saving...' : 'Confirm Disposition'}
                             </Button>
                         </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <ShieldCheck className="mx-auto h-16 w-16 text-emerald-500" />
                        <h3 className="text-xl font-bold text-emerald-700">QA Passed</h3>
                        <p className="text-muted-foreground">Ready to generate digital compliance certificate.</p>
                        <Button size="lg" className="w-full" onClick={handleCertify} disabled={loading || !canExecute}>
                            {loading ? 'Generating...' : 'Generate Certificate'}
                        </Button>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <div className="p-6 border rounded-lg bg-slate-50 dark:bg-slate-800">
                             <h3 className="font-bold text-lg mb-4">Summary</h3>
                             <div className="space-y-2 text-sm">
                                 <div className="flex justify-between"><span>Disposition:</span> <strong>{battery?.qaDisposition}</strong></div>
                                 {battery?.certificateRef && <div className="flex justify-between"><span>Certificate:</span> <span className="font-mono">{battery.certificateRef}</span></div>}
                                 {battery?.qaDisposition !== 'PASS' && <div className="flex justify-between text-rose-600"><span>Reason:</span> <strong>{reasonCode}</strong></div>}
                             </div>
                        </div>
                        {battery?.certificateRef && (
                            <Button variant="outline" className="w-full gap-2">
                                <Download className="h-4 w-4" /> Download PDF Stub
                            </Button>
                        )}
                        <Button size="lg" className="w-full" onClick={handleFinalize} disabled={loading || !canExecute}>
                            Finalize & Release
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Station Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-700 font-bold">
                        {stationId.split('-')[1]}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">EOL / QA Station</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Operator: {userLabel}</span>
                            <span className="text-slate-300">|</span>
                            <span className={battery ? "text-blue-500 font-semibold" : "text-emerald-500 font-semibold"}>
                                {battery ? 'BUSY' : 'READY'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset Station
                     </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Stepper Area */}
                <Card className="flex-1">
                    <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                             <CardTitle>Step {currentStep + 1}: {STEP_TITLES[currentStep]}</CardTitle>
                             <div className="flex gap-1">
                                {STEP_TITLES.map((_, i) => (
                                    <div key={i} className={`h-2 w-8 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                ))}
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {renderStepContent()}
                    </CardContent>
                </Card>

                {/* Context Panel */}
                <Card className="w-full lg:w-80 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {battery ? (
                            <>
                                <div>
                                    <p className="text-xs text-muted-foreground">Serial Number</p>
                                    <p className="font-mono font-bold text-lg">{battery.serialNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Batch</p>
                                    <p className="text-sm">{battery.batchId}</p>
                                </div>
                                <div className="border-t pt-2 space-y-2">
                                     <div className="flex justify-between text-sm">
                                         <span>Provisioning:</span>
                                         {/* Fix: Changed comparison value from 'PASS' to 'DONE' to match BatteryProvisioningStatus type values */}
                                         <Badge variant={battery.provisioningStatus === 'DONE' ? 'success' : 'outline'} className="text-[10px] h-5">{battery.provisioningStatus}</Badge>
                                     </div>
                                     <div className="flex justify-between text-sm">
                                         <span>EOL Status:</span>
                                         <span className="font-medium">{battery.eolStatus || 'Pending'}</span>
                                     </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <Scan className="mx-auto mb-2 h-8 w-8 opacity-20" />
                                No battery loaded
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
