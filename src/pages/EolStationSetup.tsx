import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui/design-system';
import { Save } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';

export default function EolStationSetup() {
    const { addNotification } = useAppStore();
    const [config, setConfig] = useState({
        stationId: '',
        voltageMin: '',
        voltageMax: '',
        capacityMin: ''
    });

    useEffect(() => {
        setConfig({
            stationId: localStorage.getItem('eol_station_id') || 'EOL-01',
            voltageMin: localStorage.getItem('eol_voltage_min') || '47.0',
            voltageMax: localStorage.getItem('eol_voltage_max') || '54.6',
            capacityMin: localStorage.getItem('eol_capacity_min') || '100.0',
        });
    }, []);

    const handleSave = () => {
        localStorage.setItem('eol_station_id', config.stationId);
        localStorage.setItem('eol_voltage_min', config.voltageMin);
        localStorage.setItem('eol_voltage_max', config.voltageMax);
        localStorage.setItem('eol_capacity_min', config.capacityMin);
        addNotification({ title: "Saved", message: "Station configuration updated", type: "success" });
    };

    return (
        <div className="pb-12">
            <StageHeader 
                stageCode="SET"
                title="EOL Station Setup"
                objective="Configure operational thresholds and station identity for the end-of-line test environment."
                entityLabel="Workstation Config"
                status="ACTIVE"
                diagnostics={{ route: '/assure/eol/setup', entityId: 'QA-ST-SETUP' }}
            />

            <div className="max-w-2xl mx-auto space-y-6 px-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Threshold Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Station Identifier</label>
                            <Input value={config.stationId} onChange={(e) => setConfig({...config, stationId: e.target.value})} placeholder="e.g. EOL-01" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Voltage Min (V)</label>
                                <Input value={config.voltageMin} onChange={(e) => setConfig({...config, voltageMin: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Voltage Max (V)</label>
                                <Input value={config.voltageMax} onChange={(e) => setConfig({...config, voltageMax: e.target.value})} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Capacity Min (Ah)</label>
                            <Input value={config.capacityMin} onChange={(e) => setConfig({...config, capacityMin: e.target.value})} />
                        </div>

                        <div className="pt-4">
                            <Button onClick={handleSave} className="w-full">
                                <Save className="mr-2 h-4 w-4" /> Save Configuration
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}