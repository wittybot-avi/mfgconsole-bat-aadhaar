import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { RouteGuard } from './components/RouteGuard';
import { ScreenId } from './rbac/screenIds';
import { Layout } from './components/Layout';
import { ROUTES } from '../app/routes';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Telemetry from './pages/Telemetry';
import Analytics from './pages/Analytics';
import SkuList from './pages/SkuList';
import SkuDetail from './pages/SkuDetail';
import CellLotsList from './pages/CellLotsList';
import CellLotDetail from './pages/CellLotDetail';
import CreateCellLot from './pages/CreateCellLot';
import LineageView from './pages/LineageView';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import ModuleAssemblyList from './pages/ModuleAssemblyList';
import ModuleAssemblyDetail from './pages/ModuleAssemblyDetail';
import PackAssemblyList from './pages/PackAssemblyList';
import PackAssemblyDetail from './pages/PackAssemblyDetail';
import Batteries from './pages/Batteries';
import BatteryDetail from './pages/BatteryDetail';
import ProvisioningConsole from './pages/ProvisioningConsole';
import ProvisioningStationSetup from './pages/ProvisioningStationSetup';
import ProvisioningQueue from './pages/ProvisioningQueue';
import InventoryList from './pages/InventoryList';
import DispatchList from './pages/DispatchList';
import DispatchDetail from './pages/DispatchDetail';
import EolQaList from './pages/EolQaList';
import EolDetails from './pages/EolDetails';
import EolRunTest from './pages/EolRunTest';
import EolAuditDetail from './pages/EolAuditDetail';
import Compliance from './pages/Compliance';
import Custody from './pages/Custody';
import CustodyDetail from './pages/CustodyDetail';
import Warranty from './pages/Warranty';
import WarrantyDetail from './pages/WarrantyDetail';
import WarrantyIntake from './pages/WarrantyIntake';
import RbacAdmin from './pages/RbacAdmin';
import Settings from './pages/Settings';
import DiagnosticsPage from './pages/DiagnosticsPage';
import EolStationSetup from './pages/EolStationSetup';
import EolReview from './pages/EolReview';
import NotFound from './pages/NotFound';
import RunbookHub from './pages/RunbookHub';
import RunbookDetail from './pages/RunbookDetail';

/**
 * Legacy Param Redirect Helper
 */
const ParamRedirect = ({ to }: { to: string }) => {
  const params = useParams();
  const id = params.id || params.batchId || params.assetId || params.packId || params.itemId || params.dispatchId || params.orderId || params.buildId;
  return <Navigate to={`${to}/${id}`} replace />;
};

/**
 * Main Application Routing Node
 * Patch PP-056F: Canonical Route Ledger & Version Stabilization.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          
          <Route path="/" element={<AuthGate><Layout /></AuthGate>}>
            <Route index element={<RouteGuard screen={ScreenId.DASHBOARD}><Dashboard /></RouteGuard>} />
            
            {/* Observe */}
            <Route path={ROUTES.TELEMETRY.substring(1)} element={<RouteGuard screen={ScreenId.TELEMETRY}><Telemetry /></RouteGuard>} />
            <Route path={ROUTES.ANALYTICS.substring(1)} element={<RouteGuard screen={ScreenId.ANALYTICS}><Analytics /></RouteGuard>} />
            
            {/* SOP Guide */}
            <Route path={ROUTES.RUNBOOKS.substring(1)} element={<RouteGuard screen={ScreenId.RUNBOOK_HUB}><RunbookHub /></RouteGuard>} />
            <Route path={ROUTES.RUNBOOK_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.RUNBOOK_DETAIL}><RunbookDetail /></RouteGuard>} />

            {/* Design */}
            <Route path={ROUTES.SKU_DESIGN.substring(1)} element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuList /></RouteGuard>} />
            <Route path={ROUTES.SKU_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuDetail /></RouteGuard>} />
            
            {/* Trace */}
            <Route path="trace/cells">
               <Route index element={<Navigate to={ROUTES.CELL_SERIALIZATION_HAPPY} replace />} />
               <Route path="lot-happy" element={<RouteGuard screen={ScreenId.CELL_LOTS_LIST}><CellLotsList /></RouteGuard>} />
               <Route path="new" element={<RouteGuard screen={ScreenId.CELL_LOTS_CREATE}><CreateCellLot /></RouteGuard>} />
               <Route path=":lotId" element={<RouteGuard screen={ScreenId.CELL_LOTS_DETAIL}><CellLotDetail /></RouteGuard>} />
            </Route>
            <Route path={ROUTES.LINEAGE_AUDIT.substring(1)} element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
            <Route path={ROUTES.LINEAGE_AUDIT_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
            
            {/* Operate */}
            <Route path={ROUTES.BATCHES.substring(1)} element={<RouteGuard screen={ScreenId.BATCHES_LIST}><Batches /></RouteGuard>} />
            <Route path={ROUTES.BATCH_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.BATCHES_DETAIL}><BatchDetail /></RouteGuard>} />
            <Route path={ROUTES.MODULE_ASSEMBLY.substring(1)} element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_LIST}><ModuleAssemblyList /></RouteGuard>} />
            <Route path={ROUTES.MODULE_ASSEMBLY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_DETAIL}><ModuleAssemblyDetail /></RouteGuard>} />
            <Route path={ROUTES.PACK_ASSEMBLY.substring(1)} element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_LIST}><PackAssemblyList /></RouteGuard>} />
            <Route path={ROUTES.PACK_ASSEMBLY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_DETAIL}><PackAssemblyDetail /></RouteGuard>} />
            <Route path={ROUTES.BATTERY_IDENTITY.substring(1)} element={<RouteGuard screen={ScreenId.BATTERIES_LIST}><Batteries /></RouteGuard>} />
            <Route path={ROUTES.BATTERY_IDENTITY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.BATTERIES_DETAIL}><BatteryDetail /></RouteGuard>} />

            <Route path={ROUTES.PROVISIONING_QUEUE.substring(1)} element={<RouteGuard screen={ScreenId.PROVISIONING_QUEUE}><ProvisioningQueue /></RouteGuard>} />
            <Route path={ROUTES.PROVISIONING_SETUP.substring(1)} element={<RouteGuard screen={ScreenId.PROVISIONING_STATION_SETUP}><ProvisioningStationSetup /></RouteGuard>} />
            <Route path={ROUTES.PROVISIONING_WORKSTATION.substring(1)} element={<RouteGuard screen={ScreenId.PROVISIONING}><ProvisioningConsole /></RouteGuard>} />
            
            <Route path={ROUTES.INVENTORY.substring(1)} element={<RouteGuard screen={ScreenId.INVENTORY}><InventoryList /></RouteGuard>} />
            <Route path={ROUTES.DISPATCH_ORDERS.substring(1)} element={<RouteGuard screen={ScreenId.DISPATCH_LIST}><DispatchList /></RouteGuard>} />
            <Route path={ROUTES.DISPATCH_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.DISPATCH_DETAIL}><DispatchDetail /></RouteGuard>} />
            
            {/* Assure (EOL Canonical) */}
            <Route path={ROUTES.EOL_QUEUE.substring(1)} element={<RouteGuard screen={ScreenId.EOL_QA_QUEUE}><EolQaList /></RouteGuard>} />
            <Route path={ROUTES.EOL_SETUP.substring(1)} element={<RouteGuard screen={ScreenId.EOL_SETUP}><EolStationSetup /></RouteGuard>} />
            <Route path={ROUTES.EOL_REVIEW.substring(1)} element={<RouteGuard screen={ScreenId.EOL_REVIEW}><EolReview /></RouteGuard>} />
            <Route path={ROUTES.EOL_DETAILS.substring(1)} element={<RouteGuard screen={ScreenId.EOL_DETAILS}><EolDetails /></RouteGuard>} />
            <Route path={ROUTES.EOL_RUN.substring(1)} element={<RouteGuard screen={ScreenId.EOL_RUN_TEST}><EolRunTest /></RouteGuard>} />
            <Route path={ROUTES.EOL_AUDIT.substring(1)} element={<RouteGuard screen={ScreenId.EOL_AUDIT_DETAIL}><EolAuditDetail /></RouteGuard>} />

            {/* Govern & Resolve */}
            <Route path={ROUTES.COMPLIANCE.substring(1)} element={<RouteGuard screen={ScreenId.COMPLIANCE}><Compliance /></RouteGuard>} />
            <Route path={ROUTES.CUSTODY.substring(1)} element={<RouteGuard screen={ScreenId.CUSTODY}><Custody /></RouteGuard>} />
            <Route path={ROUTES.CUSTODY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.CUSTODY}><CustodyDetail /></RouteGuard>} />
            <Route path={ROUTES.WARRANTY_RETURNS.substring(1)} element={<RouteGuard screen={ScreenId.WARRANTY}><Warranty /></RouteGuard>} />
            <Route path={ROUTES.WARRANTY_CLAIM_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.WARRANTY}><WarrantyDetail /></RouteGuard>} />
            <Route path={ROUTES.WARRANTY_INTAKE.substring(1)} element={<RouteGuard screen={ScreenId.WARRANTY_EXTERNAL_INTAKE}><WarrantyIntake /></RouteGuard>} />
            
            {/* Admin */}
            <Route path={ROUTES.SETTINGS.substring(1)} element={<RouteGuard screen={ScreenId.SETTINGS}><Settings /></RouteGuard>} />
            <Route path={ROUTES.ACCESS_AUDIT.substring(1)} element={<RouteGuard screen={ScreenId.RBAC_VIEW}><RbacAdmin /></RouteGuard>} />
            <Route path={ROUTES.SYSTEM_HEALTH.substring(1)} element={<DiagnosticsPage />} />

            {/* Redirects */}
            <Route path="eol" element={<Navigate to={ROUTES.EOL_QUEUE} replace />} />
            <Route path="eol-setup" element={<Navigate to={ROUTES.EOL_SETUP} replace />} />
            <Route path="eol-review" element={<Navigate to={ROUTES.EOL_REVIEW} replace />} />
            <Route path="provisioning" element={<Navigate to={ROUTES.PROVISIONING_QUEUE} replace />} />
            
            {/* Legacy Detail Param Redirects */}
            <Route path="batches/:id" element={<ParamRedirect to="/operate/batches" />} />
            <Route path="batch/:id" element={<ParamRedirect to="/operate/batches" />} />
            <Route path="packs/:id" element={<ParamRedirect to="/operate/packs" />} />
            <Route path="battery/:id" element={<ParamRedirect to="/operate/batteries" />} />
            <Route path="eol/details/:id" element={<ParamRedirect to="/assure/eol/details" />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}