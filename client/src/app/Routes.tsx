import { Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, useRoutes } from "react-router-dom";

import { Bullseye, Spinner } from "@patternfly/react-core";
import { ErrorFallback } from "./components/ErrorFallback";
import NotFound from "./pages/NotFound";

const Artifacts = lazy(() => import("./pages/Artifacts"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TotalArtifacts = lazy(() => import("./pages/Dashboard/TotalArtifacts"));
const TrustRoot = lazy(() => import("./pages/TrustRoot"));
const RekorSearch = lazy(() => import("./pages/RekorSearch"));
const RekorEntryDetail = lazy(() => import("./pages/RekorSearch/EntryDetail"));
const OperationalHealth = lazy(() => import("./pages/OperationalHealth"));
const Alerts = lazy(() => import("./pages/Alerts"));

export const Paths = {
  dashboard: "/dashboard",
  totalArtifacts: "/dashboard/total-artifacts",
  operationalHealth: "/operational-health",
  artifacts: "/artifacts",
  rekorSearch: "/rekor-search",
  rekorEntry: "/rekor-search/:uuid",
  trustRoot: "/trust-root",
  alerts: "/alerts",
} as const;

export const AppRoutes = () => {
  const allRoutes = useRoutes([
    { path: "/", element: <Navigate to={Paths.dashboard} /> },
    { path: Paths.dashboard, element: <Dashboard /> },
    { path: Paths.totalArtifacts, element: <TotalArtifacts /> },
    { path: Paths.operationalHealth, element: <OperationalHealth /> },
    { path: Paths.trustRoot, element: <TrustRoot /> },
    { path: Paths.artifacts, element: <Artifacts /> },
    { path: Paths.rekorSearch, element: <RekorSearch /> },
    { path: Paths.rekorEntry, element: <RekorEntryDetail /> },
    { path: Paths.alerts, element: <Alerts /> },
    { path: "*", element: <NotFound /> },
  ]);

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }
    >
      <ErrorBoundary FallbackComponent={ErrorFallback} key={location.pathname}>
        {allRoutes}
      </ErrorBoundary>
    </Suspense>
  );
};
