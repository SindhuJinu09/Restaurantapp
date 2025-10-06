import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="relative h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 h-screen overflow-y-auto">
          <Topbar />
          <main className="h-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
