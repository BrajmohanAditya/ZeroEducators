import DashboardSidebar from "../../components/Admin/Sidebar";
import React from "react";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden min-w-0 custom-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
