import DashboardSidebar from "../../components/Admin/Sidebar";

import React from "react";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 overflow-x-hidden">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
