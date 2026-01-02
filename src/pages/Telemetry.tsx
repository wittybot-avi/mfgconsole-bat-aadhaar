import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { telemetryService, TelemetryHistory, TelemetryEvent } from '../services/telemetryService';
import { Battery, TelemetryPoint } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Tooltip } from '../components/ui/design-system';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { Play, Pause, RefreshCw, History, Activity, Search, AlertCircle, Calendar, Download } from 'lucide-react';
import { canView, canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';

// --- Components ---

const MetricCard = ({ label, value, unit, color, icon: Icon, simple }: any) => (
  <Card className={`bg-slate-900 text-white border-slate-800 ${simple ? 'h-32' : ''}`}>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className={`h-4 w-4 text-${color}-400`} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <p className={`text-3xl font-mono font-bold text-${color}-400`}>{value}</p>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
    </CardContent>
  </Card>
);

const EventMarker = ({ event }: { event: TelemetryEvent, key?: any }) => (
    <div className="flex gap-2 items-start text-xs border-l-2 border-primary pl-2 py-1 mb-2">
        <div className="text-muted-foreground w-20 shrink-0">{new Date(event.timestamp).toLocaleTimeString()}</div>
        <div>
            <Badge variant="outline" className="text-[10px] mr-2">{event.type}</Badge>
            <span>{event.message}</span>
        </div>
    </div>
);

// --- Main Page ---

export default function Telemetry() {
  const { currentCluster, currentRole, addNotification } = useAppStore();
  
  // RBAC
  const canLive = canView(currentCluster?.id || '', ScreenId.TELEMETRY_LIVE_VIEW);
  const canHistory = canView(currentCluster?.id || '', ScreenId.TELEMETRY_HISTORY_VIEW);
  const canExport = canDo(currentCluster?.id || '', ScreenId.TELEMETRY_EXPORT, 'X');
  
  // State
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [batteryList, setBatteryList] = useState<Battery[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'live' | 'history'>(canLive ? 'live' : 'history');
  
  // Live Data State
  const [liveData, setLiveData] = useState<TelemetryPoint[]>([]);
  const [isLive, setIsLive] = useState(true);
  const intervalRef = useRef<any>(null);

  // History Data State
  const [historyRange, setHistoryRange] = useState('1h');
  const [historyData, setHistoryData] = useState<TelemetryHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load Accessible Batteries
  useEffect(() => {
    loadBatteryList();
  }, [currentCluster]);

  // Handle Mode Switching fallback
  useEffect(() => {
      if (viewMode === 'live' && !canLive) setViewMode('history');
      if (viewMode === 'history' && !canHistory) setViewMode('live');
  }, [canLive, canHistory]);

  const loadBatteryList = async () => {
      const list = await telemetryService.getAccessibleBatteries(currentCluster?.id || '', search);
      setBatteryList(list);
      // Auto-select first if none selected
      if (!selectedBattery && list.length > 0) {
          setSelectedBattery(list[0]);
      }
  };

  // Live Stream Effect
  useEffect(() => {
    if (viewMode === 'live' && selectedBattery && isLive) {
      startLiveStream();
    } else {
      stopLiveStream();
    }
    return () => stopLiveStream();
  }, [viewMode, selectedBattery, isLive]);

  // History Load Effect
  useEffect(() => {
      if (viewMode === 'history' && selectedBattery) {
          loadHistory();
      }
  }, [viewMode, selectedBattery, historyRange]);

  const startLiveStream = async () => {
    if (!selectedBattery) return;
    
    // Initialize buffer
    const initialBuffer = await telemetryService.getLiveBuffer(selectedBattery.id);
    setLiveData(initialBuffer);

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setLiveData(prev => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const next = telemetryService.generateNextPoint(last);
        return [...prev.slice(1), next];
      });
    }, 1000);
  };

  const stopLiveStream = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const loadHistory = async () => {
      if (!selectedBattery) return;
      setLoadingHistory(true);
      const data = await telemetryService.getHistory(selectedBattery.id, historyRange);
      setHistoryData(data);
      setLoadingHistory(false);
  };

  const handleExport = () => {
      if (!liveData.length && !historyData?.samples.length) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(viewMode === 'live' ? liveData : historyData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `telemetry_${selectedBattery?.id}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addNotification({ title: "Exported", message: "Telemetry data downloaded.", type: "success" });
  };

  // Derived Values
  const lastPoint: Partial<TelemetryPoint> = liveData[liveData.length - 1] || {};

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Telemetry</h2>
          <p className="text-muted-foreground">Real-time and historical sensor data analysis.</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-md border">
            {canLive && (
                <button 
                    onClick={() => setViewMode('live')}
                    className={`px-3 py-1.5 text-sm font-medium rounded flex items-center gap-2 ${viewMode === 'live' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Activity size={16} /> Live
                </button>
            )}
            {canHistory && (
                <button 
                    onClick={() => setViewMode('history')}
                    className={`px-3 py-1.5 text-sm font-medium rounded flex items-center gap-2 ${viewMode === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <History size={16} /> History
                </button>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* Battery Picker Sidebar */}
          <Card className="w-full lg:w-72 flex flex-col shrink-0">
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Target Asset</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                  <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Filter batteries..." 
                        className="pl-8" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadBatteryList()}
                      />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto border rounded-md bg-slate-50 dark:bg-slate-950">
                      {batteryList.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                              {search ? 'No matches found.' : 'No batteries available for your role.'}
                          </div>
                      ) : (
                          batteryList.map(b => (
                              <div 
                                key={b.id} 
                                onClick={() => setSelectedBattery(b)}
                                className={`p-3 border-b cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${selectedBattery?.id === b.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                              >
                                  <div className="font-mono font-bold text-sm">{b.serialNumber}</div>
                                  <div className="flex justify-between mt-1">
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto">{b.status}</Badge>
                                      <span className="text-xs text-muted-foreground">{b.batchId}</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </CardContent>
          </Card>

          {/* Visualization Area */}
          <div className="flex-1 min-w-0 space-y-6 overflow-y-auto">
              {selectedBattery ? (
                  <>
                    {/* Header for Selection */}
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {selectedBattery.serialNumber} 
                                {viewMode === 'live' && isLive && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                            </h3>
                            <p className="text-xs text-muted-foreground">{selectedBattery.id} • {selectedBattery.status}</p>
                        </div>
                        <div className="flex gap-2">
                            {viewMode === 'live' && (
                                <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)}>
                                    {isLive ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                                    {isLive ? 'Pause' : 'Resume'}
                                </Button>
                            )}
                            {viewMode === 'history' && (
                                <select 
                                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                    value={historyRange}
                                    onChange={(e) => setHistoryRange(e.target.value)}
                                >
                                    <option value="15m">Last 15 Min</option>
                                    <option value="1h">Last 1 Hour</option>
                                    <option value="24h">Last 24 Hours</option>
                                </select>
                            )}
                            {canExport && (
                                <Button variant="outline" size="sm" onClick={handleExport}>
                                    <Download className="h-4 w-4 mr-1" /> Export
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* LIVE VIEW */}
                    {viewMode === 'live' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard label="Voltage" value={lastPoint.voltage?.toFixed(2)} unit="V" color="emerald" icon={Activity} />
                                <MetricCard label="Current" value={lastPoint.current?.toFixed(2)} unit="A" color="blue" icon={Activity} />
                                <MetricCard label="Temp" value={lastPoint.temperature?.toFixed(1)} unit="°C" color="amber" icon={Activity} />
                                <MetricCard label="SoC" value={lastPoint.soc?.toFixed(1)} unit="%" color="purple" icon={Activity} />
                            </div>

                            <Card>
                                <CardHeader><CardTitle>Real-time Voltage & Current</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-[300px] min-h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={liveData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                                <XAxis dataKey="timestamp" tick={false} />
                                                <YAxis yAxisId="left" domain={['auto', 'auto']} width={40} />
                                                <YAxis yAxisId="right" orientation="right" width={40} />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                    labelFormatter={() => ''}
                                                />
                                                <Area yAxisId="left" type="monotone" dataKey="voltage" stroke="#10b981" fill="#10b981" fillOpacity={0.1} isAnimationActive={false} />
                                                <Area yAxisId="right" type="monotone" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <Badge variant="outline" className="text-[10px]">Simulated stream (frontend demo)</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* HISTORY VIEW */}
                    {viewMode === 'history' && (
                        <div className="space-y-6 animate-in fade-in">
                            {loadingHistory ? (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading history data...</div>
                            ) : (
                                <>
                                    <Card>
                                        <CardHeader><CardTitle>Historical Performance ({historyRange})</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="h-[300px] min-h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={historyData?.samples}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis 
                                                            dataKey="timestamp" 
                                                            tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                                            minTickGap={50}
                                                        />
                                                        <YAxis domain={['auto', 'auto']} />
                                                        <RechartsTooltip 
                                                            labelFormatter={(label) => new Date(label).toLocaleString()}
                                                        />
                                                        <Line type="monotone" dataKey="voltage" stroke="#10b981" dot={false} strokeWidth={2} />
                                                        <Line type="monotone" dataKey="temperature" stroke="#f59e0b" dot={false} strokeWidth={2} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Event Timeline */}
                                    {historyData?.events && historyData.events.length > 0 && (
                                        <Card>
                                            <CardHeader><CardTitle className="text-base">Event Log</CardTitle></CardHeader>
                                            <CardContent>
                                                {historyData.events.map(evt => <EventMarker key={evt.id} event={evt} />)}
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                  </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                      <h3 className="text-lg font-semibold">No Asset Selected</h3>
                      <p className="max-w-xs text-center mt-2 text-sm">Select a battery from the list to view telemetry data. If the list is empty, no batteries match your role's visibility.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}