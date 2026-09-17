import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  BookOpen,
  Tag,
  Zap,
  RefreshCw,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileQuestion,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useGetAdminAnalyticsHook } from "../../hooks/analytics.hook";

export default function AnalyticsDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminAnalyticsHook();
  const [chartView, setChartView] = useState("monthly"); // "monthly" | "daily"
  const [chartMetric, setChartMetric] = useState("revenue"); // "revenue" | "orders"
  const [hoveredBar, setHoveredBar] = useState(null);

  const analytics = data?.data;
  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalDiscount: 0,
    todayRevenue: 0,
    todayOrders: 0,
    thisMonthRevenue: 0,
    thisMonthOrders: 0,
    growthPercentage: 0,
  };

  const monthlyData = analytics?.monthlyData || [];
  const dailyData = analytics?.dailyData || [];
  const activeChartData = chartView === "monthly" ? monthlyData : dailyData;

  const topCourses = analytics?.topCourses || [];
  const recentOrders = analytics?.recentOrders || [];
  const categoryBreakdown = analytics?.categoryBreakdown || {
    course: { revenue: 0, orders: 0 },
    exam: { revenue: 0, orders: 0 },
  };

  // Helper currency formatter
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const avgOrderValue =
    summary.totalOrders > 0
      ? Math.round(summary.totalRevenue / summary.totalOrders)
      : 0;

  // Chart max value calculation
  const maxVal = Math.max(
    ...activeChartData.map((d) => (chartMetric === "revenue" ? d.revenue : d.orders)),
    1
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-28 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Analytics & Sales Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Data
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time track of your platform revenue, orders, student registrations, and course sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60 border border-slate-200"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-indigo-600" : ""}`} />
            {isFetching ? "Updating..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl text-center">
          <p className="font-bold">Failed to load analytics data.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Total Revenue */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-xl shadow-indigo-950/10 border border-indigo-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Total Platform Sales
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-300" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {formatINR(summary.totalRevenue)}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                      summary.growthPercentage >= 0
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {summary.growthPercentage >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {summary.growthPercentage >= 0 ? `+${summary.growthPercentage}%` : `${summary.growthPercentage}%`}
                  </span>
                  <span className="text-slate-400 text-[11px]">vs last month</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Orders */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Orders
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {summary.totalOrders.toLocaleString()}
                </h2>
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">AOV:</span>
                  <span>{formatINR(avgOrderValue)} per order</span>
                </p>
              </div>
            </div>

            {/* Card 3: Today's Sales */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Today's Sales
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatINR(summary.todayRevenue)}
                </h2>
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600">{summary.todayOrders} orders</span>
                  <span>placed today</span>
                </p>
              </div>
            </div>

            {/* Card 4: Registered Students */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Students
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {summary.totalStudents.toLocaleString()}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Active learners registered on platform
                </p>
              </div>
            </div>

            {/* Card 5: Courses Published */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Courses
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {summary.totalCourses.toLocaleString()}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Video and PDF courses available
                </p>
              </div>
            </div>

            {/* Card 6: Total Discount Given */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Discounts Saved by Users
                </span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-rose-600" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatINR(summary.totalDiscount)}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Savings provided via coupon codes
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Sales & Orders Trend
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {chartView === "monthly" ? "Past 6 Months Performance" : "Past 7 Days Performance"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Selector */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                  <button
                    onClick={() => setChartMetric("revenue")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      chartMetric === "revenue"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    onClick={() => setChartMetric("orders")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      chartMetric === "orders"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Orders
                  </button>
                </div>

                {/* View Period Selector */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                  <button
                    onClick={() => setChartView("monthly")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      chartView === "monthly"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartView("daily")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      chartView === "daily"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Last 7 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Bar Chart Canvas */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-6 sm:grid-cols-6 lg:grid-cols-6 gap-2 sm:gap-4 h-64 items-end border-b border-slate-200 px-2 sm:px-4">
                {activeChartData.map((item, idx) => {
                  const val = chartMetric === "revenue" ? item.revenue : item.orders;
                  const heightPercent = maxVal > 0 ? Math.max((val / maxVal) * 100, 4) : 4;
                  const isHovered = hoveredBar === idx;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-end h-full group relative"
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                          <p className="font-bold">{item.label}</p>
                          <p className="text-indigo-300">
                            {chartMetric === "revenue" ? formatINR(item.revenue) : `${item.orders} Orders`}
                          </p>
                          <p className="text-slate-400 text-[9px]">
                            {chartMetric === "revenue" ? `${item.orders} Orders` : formatINR(item.revenue)}
                          </p>
                        </div>
                      )}

                      {/* Bar */}
                      <div className="w-full max-w-[48px] flex flex-col items-center justify-end h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 cursor-pointer ${
                            isHovered
                              ? "bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-lg shadow-indigo-200"
                              : "bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500"
                          }`}
                        />
                      </div>

                      {/* X-axis Label */}
                      <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate w-full text-center">
                        {item.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two-Column Section: Category Breakdown & Top Courses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown (1 col) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Sales by Category
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revenue contribution from Courses vs Mock Exams
                </p>
              </div>

              <div className="space-y-4 py-2">
                {/* Course Sales */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Courses
                    </span>
                    <span className="font-black text-slate-900">
                      {formatINR(categoryBreakdown.course.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          summary.totalRevenue > 0
                            ? (categoryBreakdown.course.revenue / summary.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-right">
                    {categoryBreakdown.course.orders} orders (
                    {summary.totalRevenue > 0
                      ? Math.round(
                          (categoryBreakdown.course.revenue / summary.totalRevenue) * 100
                        )
                      : 0}
                    %)
                  </p>
                </div>

                {/* Exam Sales */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <FileQuestion className="w-3.5 h-3.5 text-purple-600" /> Mock Exams
                    </span>
                    <span className="font-black text-slate-900">
                      {formatINR(categoryBreakdown.exam.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          summary.totalRevenue > 0
                            ? (categoryBreakdown.exam.revenue / summary.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-right">
                    {categoryBreakdown.exam.orders} orders (
                    {summary.totalRevenue > 0
                      ? Math.round(
                          (categoryBreakdown.exam.revenue / summary.totalRevenue) * 100
                        )
                      : 0}
                    %)
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Combined Orders:</span>
                <span className="font-bold text-slate-800">{summary.totalOrders}</span>
              </div>
            </div>

            {/* Top Performing Courses (2 cols) */}
            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Performing Courses
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Courses generating the highest revenue and enrollment volume
                  </p>
                </div>
                {topCourses.length > 3 && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                    ↕ Scrollable ({topCourses.length})
                  </span>
                )}
              </div>

              {topCourses.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No course sales recorded yet. Once students purchase courses, they will appear here.
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1.5 space-y-2.5">
                  {topCourses.map((course, idx) => (
                    <div
                      key={course._id || idx}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          #{idx + 1}
                        </div>

                        {/* Course Thumbnail */}
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{course.orderCount} student sales</span>
                            <span>•</span>
                            <span className="uppercase text-[10px] font-bold text-slate-400">
                              {course.courseType} Course
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span className="text-xs sm:text-sm font-black text-emerald-600 block">
                          {formatINR(course.totalRevenue)}
                        </span>
                        <span className="text-[10px] text-slate-400">earned</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Recent Order Transactions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing latest {recentOrders.length} purchases processed across the platform
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                ↕ Scrollable
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No orders recorded yet. Recent transactions will automatically display here.
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl relative shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-2xs">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-3.5">Order ID</th>
                      <th className="py-3 px-3.5">Student</th>
                      <th className="py-3 px-3.5">Purchased Item</th>
                      <th className="py-3 px-3.5">Amount</th>
                      <th className="py-3 px-3.5">Coupon</th>
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {order.orderId}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{order.user?.name}</p>
                          <p className="text-[11px] text-slate-400">{order.user?.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {order.itemName}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {order.orderType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          {formatINR(order.totalAmount)}
                          {order.discountAmount > 0 && (
                            <span className="block text-[10px] font-normal text-emerald-600">
                              -₹{order.discountAmount} off
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {order.couponCode ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-100">
                              <Tag className="w-3 h-3" /> {order.couponCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
