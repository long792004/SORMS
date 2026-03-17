import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ChatbotWidget } from "../components/layout/ChatbotWidget";
import { AuthGuard, RoleGuard } from "./guards";
import { allRoutes } from "./routeRegistry";

export function AppRoutes() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          {allRoutes.public.map((entry) => (
            <Route key={entry.path} path={entry.path} element={entry.element} />
          ))}
        </Route>

        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            <Route element={<RoleGuard roles={["Resident"]} />}>
              {allRoutes.resident.map((entry) => (
                <Route key={entry.path} path={entry.path} element={entry.element} />
              ))}
            </Route>

            <Route element={<RoleGuard roles={["Staff"]} />}>
              {allRoutes.staff.map((entry) => (
                <Route key={entry.path} path={entry.path} element={entry.element} />
              ))}
            </Route>

            <Route element={<RoleGuard roles={["Admin"]} />}>
              {allRoutes.admin.map((entry) => (
                <Route key={entry.path} path={entry.path} element={entry.element} />
              ))}
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
}
