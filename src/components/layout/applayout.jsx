import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0b1120]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar setMobileOpen={setMobileOpen} lastUpdated="just now" />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
        <footer className="px-4 lg:px-6 py-4 text-center text-[11px] text-slate-500 border-t border-white/10 bg-[#0b1120]">
          NIRIKSHAN AI — Infrastructure Project Monitoring Platform
        </footer>
      </div>
    </div>
  );
}
