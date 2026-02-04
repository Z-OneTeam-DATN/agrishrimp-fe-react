import DashboardStats from "@/components/admin/DashboardStats";
import RevenueChart from "@/components/admin/RevenueChart";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">
          Tổng quan hệ thống
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Báo cáo nhanh tình hình hoạt động AgriShrimp.
        </p>
      </div>

      {/* Stats Section */}
      <DashboardStats />

      {/* Chart Section */}
      <div className="grid grid-cols-1 gap-6">
        <RevenueChart />
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-gray-300 pt-8 uppercase tracking-widest">
        AgriShrimp Platform • 2026
      </div>
    </div>
  );
}