import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Loader2,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  useSearchUsersHook,
  useGrantCourseAccessHook,
  useRevokeCourseAccessHook,
  useGetCourseEnrolledStudentsHook,
} from "../../hooks/course.hook";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { toast } from "sonner";

const GrantCourseAccessDialog = ({
  isOpen,
  onClose,
  course,
  allCourses = [],
  initialTab = "grant",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'grant' | 'students'
  const [selectedCourseId, setSelectedCourseId] = useState(course?._id || "");
  const [enrollMode, setEnrollMode] = useState("search"); // 'search' | 'create'

  // Search mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Direct create mode state
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentMobile, setNewStudentMobile] = useState("");

  // Plan duration
  const [planDuration, setPlanDuration] = useState("Lifetime Access");

  // Revoke state
  const [revokeConfirm, setRevokeConfirm] = useState(null);
  const [studentSearchFilter, setStudentSearchFilter] = useState("");

  useEffect(() => {
    if (course?._id) {
      setSelectedCourseId(course._id);
    }
  }, [course]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Hooks
  const { data: searchResults, isFetching: isSearching } = useSearchUsersHook(
    debouncedQuery,
    selectedCourseId
  );

  const {
    data: enrolledData,
    isLoading: isLoadingEnrolled,
    refetch: refetchEnrolled,
  } = useGetCourseEnrolledStudentsHook(selectedCourseId);

  const { mutate: grantAccess, isPending: isGranting } =
    useGrantCourseAccessHook(selectedCourseId);

  const { mutate: revokeAccess, isPending: isRevoking } =
    useRevokeCourseAccessHook(selectedCourseId);

  const currentCourse =
    (allCourses && allCourses.find((c) => c._id === selectedCourseId)) || course;

  const handleGrantSubmit = (e) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    if (enrollMode === "search") {
      if (!selectedUser) {
        toast.error("Please search and select a user first");
        return;
      }
      if (selectedUser.isEnrolled) {
        toast.error("This student already has access to this course");
        return;
      }

      grantAccess(
        {
          courseId: selectedCourseId,
          userId: selectedUser._id,
          planDuration,
        },
        {
          onSuccess: () => {
            setSelectedUser(null);
            setSearchQuery("");
            refetchEnrolled();
          },
        }
      );
    } else {
      if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentMobile.trim()) {
        toast.error("Please fill Name, Email, and Mobile Number");
        return;
      }

      grantAccess(
        {
          courseId: selectedCourseId,
          name: newStudentName.trim(),
          email: newStudentEmail.trim().toLowerCase(),
          mobileNo: newStudentMobile.trim(),
          planDuration,
        },
        {
          onSuccess: () => {
            setNewStudentName("");
            setNewStudentEmail("");
            setNewStudentMobile("");
            refetchEnrolled();
          },
        }
      );
    }
  };

  const handleConfirmRevoke = () => {
    if (!revokeConfirm) return;
    revokeAccess(
      { courseId: selectedCourseId, userId: revokeConfirm.id },
      {
        onSuccess: () => {
          setRevokeConfirm(null);
          refetchEnrolled();
        },
      }
    );
  };

  const enrolledStudents = enrolledData?.students || [];
  const filteredStudents = enrolledStudents.filter((s) => {
    if (!studentSearchFilter.trim()) return true;
    const q = studentSearchFilter.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      String(s.mobileNo || "").includes(q)
    );
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  Course Student Management
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Grant course access to students or manage enrolled users.
                </DialogDescription>
              </div>

              {currentCourse && (
                <div className="hidden sm:block text-right">
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">
                    Target Course
                  </span>
                  <span className="text-xs font-black text-emerald-400 line-clamp-1 max-w-[200px]">
                    {currentCourse.title}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mt-4 border-b border-slate-700/80 -mb-4 pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("grant")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "grant"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-4 h-4" /> Grant Course Access
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "students"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" /> Enrolled Students ({enrolledStudents.length})
              </button>
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Course Selector if allCourses provided */}
            {allCourses && allCourses.length > 1 && (
              <div className="mb-5 pb-4 border-b border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedUser(null);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {allCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.enrolled || 0} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* TAB 1: GRANT ACCESS */}
            {activeTab === "grant" && (
              <form onSubmit={handleGrantSubmit} className="space-y-5 text-left">
                {/* Mode Selector Pill */}
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollMode("search");
                      setSelectedUser(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      enrollMode === "search"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" /> Search Registered User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollMode("create");
                      setSelectedUser(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      enrollMode === "create"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Onboard New Student
                  </button>
                </div>

                {enrollMode === "search" ? (
                  /* Search Registered User */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Search User (by Email, Mobile No, or Name)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type email (e.g. user@gmail.com) or 10-digit mobile number..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        {isSearching && (
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Selected User Badge */}
                    {selectedUser && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Selected: {selectedUser.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {selectedUser.email} • {selectedUser.mobileNo}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {/* Search Results Dropdown / List */}
                    {!selectedUser && searchQuery.trim().length >= 2 && (
                      <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                        {searchResults?.users && searchResults.users.length > 0 ? (
                          searchResults.users.map((u) => (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => {
                                if (u.isEnrolled) {
                                  toast.info(`${u.name} is already enrolled in this course`);
                                  return;
                                }
                                setSelectedUser(u);
                              }}
                              className={`w-full p-3 flex items-center justify-between text-left transition cursor-pointer hover:bg-white ${
                                u.isEnrolled ? "opacity-60 bg-slate-100" : ""
                              }`}
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900">{u.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  {u.email} • {u.mobileNo}
                                </p>
                              </div>
                              <div>
                                {u.isEnrolled ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Already Enrolled
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                                    Select
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        ) : !isSearching ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No user found matching "{searchQuery}". You can switch to "Onboard New Student" above to enroll them!
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Onboard New Student */
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">
                      Enter student details. An account will automatically be created and granted immediate access!
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        required
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. rahul@gmail.com"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={newStudentMobile}
                          onChange={(e) => setNewStudentMobile(e.target.value)}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Validity Duration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Access Validity / Plan Duration
                  </label>
                  <select
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Lifetime Access">Lifetime Access (Recommended)</option>
                    <option value="1 Year Access">1 Year Access</option>
                    <option value="6 Months Access">6 Months Access</option>
                    <option value="3 Months Access">3 Months Access</option>
                    <option value="1 Month Access">1 Month Access</option>
                    {currentCourse?.pricingPlans?.map((p, idx) => (
                      <option key={idx} value={p.duration}>
                        Plan: {p.duration} ({p.label || `₹${p.price}`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGranting || (enrollMode === "search" && !selectedUser)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGranting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Granting Course...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Grant Course Access
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ENROLLED STUDENTS */}
            {activeTab === "students" && (
              <div className="space-y-4">
                {/* Search in Enrolled Students */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter enrolled students by name, email, or phone..."
                    value={studentSearchFilter}
                    onChange={(e) => setStudentSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                {isLoadingEnrolled ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Loading enrolled students...</p>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {filteredStudents.map((s, sIdx) => (
                      <div
                        key={s._id || sIdx}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {s.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                              <span>{s.email}</span>
                              <span>•</span>
                              <span>{s.mobileNo}</span>
                            </p>
                            <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                              Enrolled: {new Date(s.enrolledAt).toLocaleDateString()} • {s.planDuration} •{" "}
                              <strong className="text-emerald-700">{s.grantType}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isRevoking}
                          onClick={() => {
                            setRevokeConfirm({
                              id: s._id,
                              name: s.name,
                              title: currentCourse?.title || "this course",
                            });
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200 cursor-pointer shrink-0 inline-flex items-center gap-1"
                          title="Revoke Course Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-700">No Enrolled Students</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch to the "Grant Course Access" tab to enroll students into this course.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <DeleteAlertbox
        isOpen={Boolean(revokeConfirm)}
        itemName={`access for ${revokeConfirm?.name} from ${revokeConfirm?.title}`}
        isDeleting={isRevoking}
        onCancel={() => setRevokeConfirm(null)}
        onConfirm={handleConfirmRevoke}
      />
    </>
  );
};

export default GrantCourseAccessDialog;
