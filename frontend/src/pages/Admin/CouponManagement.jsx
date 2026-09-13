import React, { useState } from "react";
import {
  useGetAllCouponsHook,
  useCreateCouponHook,
  useUpdateCouponHook,
  useToggleCouponStatusHook,
  useDeleteCouponHook,
} from "@/hooks/coupon.hook";
import { useGetCourseHook } from "@/hooks/course.hook";
import {
  Ticket,
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { toast } from "sonner";

const CouponManagement = () => {
  const { data, isLoading } = useGetAllCouponsHook();
  const { data: coursesData } = useGetCourseHook();
  const courses = coursesData?.courses || coursesData?.course || [];

  const { mutate: createCoupon, isPending: isCreating } = useCreateCouponHook();
  const { mutate: updateCoupon, isPending: isUpdating } = useUpdateCouponHook();
  const { mutate: toggleStatus } = useToggleCouponStatusHook();
  const { mutate: deleteCoupon, isPending: isDeleting } = useDeleteCouponHook();

  const coupons = data?.coupons || [];

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive' | 'expired'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Delete State
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  // Copy Feedback
  const [copiedCode, setCopiedCode] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountAmount: "",
    maxDiscountLimit: "",
    minOrderAmount: "",
    applicableCourses: [],
    expiryDate: "",
    maxTotalUses: "",
    maxUsesPerUser: 1,
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountAmount: "",
      maxDiscountLimit: "",
      minOrderAmount: "",
      applicableCourses: [],
      expiryDate: "",
      maxTotalUses: "",
      maxUsesPerUser: 1,
      isActive: true,
    });
    setEditingCoupon(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountAmount: coupon.discountAmount || "",
      maxDiscountLimit: coupon.maxDiscountLimit || "",
      minOrderAmount: coupon.minOrderAmount || "",
      applicableCourses: coupon.applicableCourses
        ? coupon.applicableCourses.map((c) => (typeof c === "object" ? c._id : c))
        : [],
      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate).toISOString().split("T")[0]
        : "",
      maxTotalUses: coupon.maxTotalUses || "",
      maxUsesPerUser: coupon.maxUsesPerUser || 1,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    if (!formData.discountAmount || Number(formData.discountAmount) <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountAmount: Number(formData.discountAmount),
      maxDiscountLimit: formData.maxDiscountLimit ? Number(formData.maxDiscountLimit) : null,
      minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
      applicableCourses: formData.applicableCourses,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
      maxTotalUses: formData.maxTotalUses ? Number(formData.maxTotalUses) : null,
      maxUsesPerUser: formData.maxUsesPerUser ? Number(formData.maxUsesPerUser) : 1,
      isActive: formData.isActive,
    };

    if (editingCoupon) {
      updateCoupon(
        { id: editingCoupon._id, couponData: payload },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createCoupon(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();

    if (statusFilter === "active") return matchesSearch && c.isActive && !isExpired;
    if (statusFilter === "inactive") return matchesSearch && !c.isActive;
    if (statusFilter === "expired") return matchesSearch && isExpired;

    return matchesSearch;
  });

  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter(
    (c) => c.isActive && (!c.expiryDate || new Date(c.expiryDate) >= new Date())
  ).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Coupons & Discounts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Create promotional promo codes to boost course enrollment & sales.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Coupons
            </p>
            <p className="text-2xl font-black text-slate-900">{totalCouponsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Coupons
            </p>
            <p className="text-2xl font-black text-emerald-600">{activeCouponsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Redemptions
            </p>
            <p className="text-2xl font-black text-purple-600">{totalRedemptions}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "active", "inactive", "expired"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List / Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No coupons found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try changing your search query or filter"
              : "Generate your first promo code to start offering discounts on your courses!"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-sm"
            >
              + Create First Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Applicability</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isExpired =
                    coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                  const isExhausted =
                    coupon.maxTotalUses && coupon.usedCount >= coupon.maxTotalUses;

                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-xs tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[200px]">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {coupon.discountType === "percentage" ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-black">
                              {coupon.discountAmount}% OFF
                            </span>
                          ) : (
                            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs font-black">
                              ₹{coupon.discountAmount} FLAT OFF
                            </span>
                          )}
                        </div>
                        {coupon.discountType === "percentage" && coupon.maxDiscountLimit && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Max: ₹{coupon.maxDiscountLimit}
                          </p>
                        )}
                        {coupon.minOrderAmount > 0 && (
                          <p className="text-[10px] text-slate-400">
                            Min Order: ₹{coupon.minOrderAmount}
                          </p>
                        )}
                      </td>

                      {/* Course Scope */}
                      <td className="py-4 px-4">
                        {coupon.applicableCourses && coupon.applicableCourses.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            <BookOpen className="w-3 h-3" />
                            {coupon.applicableCourses.length}{" "}
                            {coupon.applicableCourses.length === 1 ? "Course" : "Courses"}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            All Courses
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {coupon.usedCount || 0}
                            {coupon.maxTotalUses ? ` / ${coupon.maxTotalUses}` : " used"}
                          </span>
                        </div>
                        {isExhausted && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Exhausted
                          </span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-4">
                        {coupon.expiryDate ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                isExpired ? "text-red-500" : "text-slate-400"
                              }`}
                            />
                            <span
                              className={
                                isExpired
                                  ? "text-red-600 font-bold"
                                  : "text-slate-700 font-medium"
                              }
                            >
                              {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Never Expires
                          </span>
                        )}
                      </td>

                      {/* Active Toggle */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(coupon._id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            coupon.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coupon.isActive ? "bg-emerald-600 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {coupon.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCoupon(coupon)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Coupon */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure discount rates, validation rules, and course eligibility.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-left">
            {/* Code and Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE20, FLAT300"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                    }))
                  }
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Diwali Discount"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Discount Type and Value */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Discount Type & Value <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, discountType: "percentage" }))
                  }
                  className={`p-2.5 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    formData.discountType === "percentage"
                      ? "border-blue-600 bg-blue-50/80 text-blue-700 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Percent className="w-4 h-4" /> Percentage (%)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, discountType: "flat" }))
                  }
                  className={`p-2.5 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    formData.discountType === "flat"
                      ? "border-blue-600 bg-blue-50/80 text-blue-700 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <IndianRupee className="w-4 h-4" /> Flat Amount (₹)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {formData.discountType === "percentage"
                      ? "Discount Percentage (%)"
                      : "Flat Discount Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    placeholder={formData.discountType === "percentage" ? "20" : "500"}
                    value={formData.discountAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: e.target.value,
                      }))
                    }
                    required
                    className="w-full p-2.5 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.discountType === "percentage" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Max Discount Cap (₹) <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500 (Max off)"
                      value={formData.maxDiscountLimit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxDiscountLimit: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Constraints: Min Order & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Min Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (No minimum)"
                  value={formData.minOrderAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, minOrderAmount: e.target.value }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Constraints: Usage Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Total Uses Limit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.maxTotalUses}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxTotalUses: e.target.value }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Uses Per Student
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsesPerUser}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxUsesPerUser: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Course Applicability Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Applicable Courses
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Leave unselected to make this coupon valid across all courses.
              </p>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 custom-scrollbar bg-slate-50/50">
                {courses.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2">No courses available.</p>
                ) : (
                  courses.map((course) => {
                    const isChecked = formData.applicableCourses.includes(course._id);
                    return (
                      <label
                        key={course._id}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer text-xs font-medium text-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                applicableCourses: [...prev.applicableCourses, course._id],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                applicableCourses: prev.applicableCourses.filter(
                                  (id) => id !== course._id
                                ),
                              }));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="truncate">{course.title}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-xs font-bold text-slate-700">
                Coupon is {formData.isActive ? "Active (Ready to redeem)" : "Inactive (Draft)"}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {(isCreating || isUpdating) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {editingCoupon ? "Update Coupon" : "Save & Publish Coupon"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <DeleteAlertbox
        open={Boolean(deletingCoupon)}
        onOpenChange={(open) => !open && setDeletingCoupon(null)}
        title="Delete Coupon"
        description={`Are you sure you want to permanently delete coupon "${deletingCoupon?.code}"? This action cannot be undone.`}
        confirmText="Yes, Delete Coupon"
        isPending={isDeleting}
        onConfirm={() => {
          if (!deletingCoupon) return;
          deleteCoupon(deletingCoupon._id, {
            onSuccess: () => setDeletingCoupon(null),
          });
        }}
      />
    </div>
  );
};

export default CouponManagement;
