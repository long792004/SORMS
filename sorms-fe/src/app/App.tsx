import { Routes, Route, Navigate } from "react-router-dom";

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 bg-radial-lux text-slate-100">
      <Routes>
        <Route path="/" element={<div className="p-8">SORMS UI Foundation Ready</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}