import StatCard from "../components/StatCard";
import AreaChartCard from "../components/AreaChartCard";
import BarChartCard from "../components/BarChartCard";
import { Activity, Brain, Gauge, Sparkles } from "lucide-react";

export default function Overview() {
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      </div>
      
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Cognitive Score"
          value="9.3"
          change="+0.4 today"
          icon={<Gauge className="h-5 w-5" />}
        />
        <StatCard
          title="Active Regions"
          value="12"
          change="+2"
          icon={<Brain className="h-5 w-5" />}
        />
        <StatCard
          title="Sessions"
          value="134"
          change="+18%"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Anomalies"
          value="3"
          change="-1"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2">
          <AreaChartCard />
        </div>
        <div className="xl:col-span-1">
          <BarChartCard />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="text-sm text-foreground/60">User: manager</div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="text-sm text-foreground/60">Current task</div>
          <div className="mt-2 text-xl font-semibold">
            Check Inventory
          </div>
          <div className="mt-1 inline-flex items-center gap-2 text-xs">
            <span className="inline-flex h-2 w-2 rounded-full bg-accent/80" />
            <span className="text-foreground/70">Pending</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="text-sm text-foreground/60">Next task</div>
          <div className="mt-2 text-2xl font-semibold">Tue, 11:30</div>
          <button className="mt-3 inline-flex items-center justify-center rounded-md bg-primary/90 px-3 py-2 text-sm text-primary-foreground hover:bg-primary">
            View details
          </button>
        </div>
      </section>
    </div>
  );
}
