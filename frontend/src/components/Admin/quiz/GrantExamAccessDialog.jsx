import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Calendar,
  Pencil,
  Plus,
  Minus,
  BookOpen,
  Link as LinkIcon,
  GraduationCap,
} from "lucide-react";
import {
  useSearchExamUsersHook,
  useGrantExamAccessHook,
  useRevokeExamAccessHook,
  useGetExamEnrolledStudentsHook,
  useUpdateExamStudentExpiryHook,
  useGetExamLinkedCoursesHook,
  useUpdateExamLinkedCoursesHook,
} from "../../../hooks/quiz/exam.hook";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { toast } from "sonner";

const GrantExamAccessDialog = ({
  isOpen,
  onClose,
  exam,
  allExams = [],
  initialTab = "grant",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'grant' | 'students'
  const [selectedExamId, setSelectedExamId] = useState(exam?._id || "");
  const [enrollMode, setEnrollMode] = useState("search"); // 'search' | 'create'

  // Search mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Direct create mode state
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentMobile, setNewStudentMobile] = useState("");

  // Plan duration (calendar date, manual month entry, or lifetime)
  const [validityType, setValidityType] = useState("lifetime"); // 'date' | 'months' | 'lifetime'
  const [validityMonths, setValidityMonths] = useState(6);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });

  // Calendar date helpers
  const getTodayDateString = () => new Date().toISOString().split("T")[0];

  const formatSelectedDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const setDateFromMonths = (monthsToAdd) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthsToAdd, now.getDate());
    setExpiryDate(target.toISOString().split("T")[0]);
  };

  // Revoke state
  const [studentToRevoke, setStudentToRevoke] = useState(null);
  const [studentSearchFilter, setStudentSearchFilter] = useState("");

  // Edit Expiry state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editDurationType, setEditDurationType] = useState("date"); // 'date' | 'lifetime'

  // Linked Courses state
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState("");

  useEffect(() => {
    if (exam?._id) {
      setSelectedExamId(exam._id);
    }
  }, [exam]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Debounced query for smooth search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Hooks
  const { data: searchResults, isFetching: isSearching } = useSearchExamUsersHook(
    debouncedQuery,
    selectedExamId
  );
  const usersFound = searchResults?.users || [];

  const {
    data: enrolledData,
    isLoading: isLoadingEnrolled,
    refetch: refetchEnrolled,
  } = useGetExamEnrolledStudentsHook(selectedExamId);
  const enrolledStudents = enrolledData?.students || [];

  const { mutate: grantAccess, isPending: isGranting } =
    useGrantExamAccessHook(selectedExamId);

  const { mutate: revokeAccess, isPending: isRevoking } =
    useRevokeExamAccessHook(selectedExamId);

  const { mutate: updateStudentExpiry, isPending: isUpdatingExpiry } =
    useUpdateExamStudentExpiryHook(selectedExamId);

  const {
    data: linkedCoursesData,
    isLoading: isLoadingLinkedCourses,
    refetch: refetchLinkedCourses,
  } = useGetExamLinkedCoursesHook(selectedExamId);

  const { mutate: updateLinkedCourses, isPending: isUpdatingLinkedCourses } =
    useUpdateExamLinkedCoursesHook(selectedExamId);

  useEffect(() => {
    if (linkedCoursesData?.linkedCourseIds) {
      setSelectedCourseIds(linkedCoursesData.linkedCourseIds.map(String));
    }
  }, [linkedCoursesData?.linkedCourseIds, selectedExamId]);

  const allCourses = linkedCoursesData?.courses || [];
  const filteredCourses = allCourses.filter((c) => {
    if (!courseSearchQuery.trim()) return true;
    return c.title?.toLowerCase().includes(courseSearchQuery.toLowerCase());
  });

  const estimatedStudentsCount = allCourses
    .filter((c) => selectedCourseIds.includes(String(c._id)))
    .reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);

  const serverLinkedIds = (linkedCoursesData?.linkedCourseIds || []).map(String);
  const currentLinkedIds = selectedCourseIds.map(String);
  const hasCourseChanges =
    serverLinkedIds.length !== currentLinkedIds.length ||
    serverLinkedIds.some((id) => !currentLinkedIds.includes(id)) ||
    currentLinkedIds.some((id) => !serverLinkedIds.includes(id));

  const handleToggleCourse = (courseId) => {
    const cId = String(courseId);
    setSelectedCourseIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const handleSelectAllCourses = () => {
    if (!linkedCoursesData?.courses) return;
    const allIds = linkedCoursesData.courses.map((c) => String(c._id));
    setSelectedCourseIds(allIds);
  };

  const handleDeselectAllCourses = () => {
    setSelectedCourseIds([]);
  };

  const handleSaveLinkedCourses = () => {
    updateLinkedCourses(
      {
        examId: selectedExamId,
        courseIds: selectedCourseIds,
      },
      {
        onSuccess: () => {
          refetchLinkedCourses();
        },
      }
    );
  };

  const currentExam =
    (allExams && allExams.find((e) => e._id === selectedExamId)) || exam;

  if (!isOpen || !currentExam) return null;

  const handleOpenEditExpiry = (student) => {
    try {
      setEditingStudent(student);
      if (student.expiresAt) {
        const d = new Date(student.expiresAt);
        if (!isNaN(d.getTime())) {
          setEditExpiryDate(d.toISOString().split("T")[0]);
          setEditDurationType("date");
          return;
        }
      }
      const match = student.planDuration?.match(/valid\s*till\s*(.+)/i);
      if (match) {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) {
          setEditExpiryDate(d.toISOString().split("T")[0]);
          setEditDurationType("date");
          return;
        }
      }
      if (student.planDuration === "Lifetime Access" || student.planDuration === "lifetime") {
        setEditDurationType("lifetime");
        setEditExpiryDate("");
        return;
      }
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setEditExpiryDate(defaultDate.toISOString().split("T")[0]);
      setEditDurationType("date");
    } catch (err) {
      console.warn("Could not parse existing date:", err);
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setEditExpiryDate(defaultDate.toISOString().split("T")[0]);
      setEditDurationType("date");
    }
  };

  const handleSaveEditExpiry = (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    let planDuration = "";
    let payloadExpiryDate = null;

    if (editDurationType === "lifetime") {
      planDuration = "Lifetime Access";
      payloadExpiryDate = null;
    } else {
      if (!editExpiryDate) {
        toast.error("Please choose an expiry date");
        return;
      }
      payloadExpiryDate = editExpiryDate;
      const parts = editExpiryDate.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formatted = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      planDuration = `Valid till ${formatted}`;
    }

    updateStudentExpiry(
      {
        examId: selectedExamId,
        userId: editingStudent._id,
        expiryDate: payloadExpiryDate,
        planDuration,
      },
      {
        onSuccess: () => {
          setEditingStudent(null);
          refetchEnrolled();
        },
      }
    );
  };

  const handleGrantAccess = (e) => {
    e.preventDefault();

    if (enrollMode === "search" && !selectedUser) {
      toast.error("Please select a student to grant access!");
      return;
    }

    if (enrollMode === "create") {
      if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentMobile.trim()) {
        toast.error("Please fill in student Name, Email, and Mobile number");
        return;
      }
    }

    let planDuration = "";
    let payloadExpiryDate = null;

    if (validityType === "lifetime") {
      planDuration = "Lifetime Access";
      payloadExpiryDate = null;
    } else if (validityType === "months") {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + Number(validityMonths));
      payloadExpiryDate = targetDate.toISOString().split("T")[0];
      planDuration = `Valid till ${targetDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    } else {
      if (!expiryDate) {
        toast.error("Please choose an expiry date");
        return;
      }
      payloadExpiryDate = expiryDate;
      const parts = expiryDate.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      planDuration = `Valid till ${d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    const payload = {
      examId: selectedExamId,
      planDuration,
      expiryDate: payloadExpiryDate,
    };

    if (enrollMode === "search") {
      payload.userId = selectedUser._id;
    } else {
      payload.name = newStudentName.trim();
      payload.email = newStudentEmail.trim().toLowerCase();
      payload.mobileNo = newStudentMobile.trim();
    }

    grantAccess(payload, {
      onSuccess: () => {
        setSelectedUser(null);
        setSearchQuery("");
        setNewStudentName("");
        setNewStudentEmail("");
        setNewStudentMobile("");
        refetchEnrolled();
        setActiveTab("students");
      },
    });
  };

  const handleConfirmRevoke = () => {
    if (!studentToRevoke) return;
    revokeAccess(
      { examId: selectedExamId, userId: studentToRevoke._id },
      {
        onSuccess: () => {
          setStudentToRevoke(null);
          refetchEnrolled();
        },
      }
    );
  };

  // Filter enrolled students
  const filteredStudents = enrolledStudents.filter((s) => {
    if (!studentSearchFilter.trim()) return true;
    const q = studentSearchFilter.toLowerCase().trim();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      String(s.mobileNo || "").includes(q)
    );
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col p-6">
          {/* Header */}
          <DialogHeader className="border-b pb-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center p-1 shrink-0">
                  {currentExam.logoUrl ? (
                    <img
                      src={currentExam.logoUrl}
                      alt={currentExam.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-black text-indigo-600 text-lg">
                      {currentExam.title?.charAt(0) || "E"}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                      {currentExam.title}
                    </DialogTitle>
                    {currentExam.category && (
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                        {currentExam.category}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                      ₹{currentExam.price || 0}
                    </span>
                  </div>

                  {allExams.length > 1 ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400">Switch Exam:</span>
                      <select
                        value={selectedExamId}
                        onChange={(e) => {
                          setSelectedExamId(e.target.value);
                          setSelectedUser(null);
                        }}
                        className="text-xs font-semibold text-indigo-600 bg-indigo-50/60 border border-indigo-200 rounded-lg px-2 py-0.5 focus:outline-none"
                      >
                        {allExams.map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.title} (₹{e.price || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Grant access & manage enrolled students for this exam package.
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200 gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("grant")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "grant"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  Grant Student
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("courses")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "courses"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                  Link Video Courses
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200">
                    {selectedCourseIds.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "students"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Enrolled Students
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-200">
                    {enrolledStudents.length}
                  </span>
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
            {activeTab === "grant" && (
              <form onSubmit={handleGrantAccess} className="space-y-5">
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollMode("search");
                      setSelectedUser(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      enrollMode === "search"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" /> Search Existing Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollMode("create");
                      setSelectedUser(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      enrollMode === "create"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Onboard New Student
                  </button>
                </div>

                {enrollMode === "search" ? (
                  /* Search Existing Student */
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder="Search student by Name, Email, or Mobile Number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
                      />
                    </div>

                    {/* Selected Student Card */}
                    {selectedUser && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {selectedUser.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {selectedUser.name}
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                Selected
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" /> {selectedUser.email}
                              </span>
                              {selectedUser.mobileNo ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" /> {selectedUser.mobileNo}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="text-xs font-semibold text-slate-500 hover:text-red-600 transition px-2 py-1 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {/* Search Results Dropdown */}
                    {!selectedUser && searchQuery.trim() && (
                      <div className="border border-slate-200 rounded-xl bg-white shadow-md max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {isSearching ? (
                          <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            Searching students...
                          </div>
                        ) : usersFound.length > 0 ? (
                          usersFound.map((u) => (
                            <div
                              key={u._id}
                              onClick={() => {
                                if (!u.isEnrolled) setSelectedUser(u);
                              }}
                              className={`p-3 flex items-center justify-between transition cursor-pointer ${
                                u.isEnrolled
                                  ? "bg-slate-50 opacity-60 cursor-not-allowed"
                                  : "hover:bg-emerald-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  {u.name?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-xs text-slate-900">
                                    {u.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {u.email} {u.mobileNo ? `• ${u.mobileNo}` : ""}
                                  </div>
                                </div>
                              </div>

                              <div>
                                {u.isEnrolled ? (
                                  <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">
                                    Already Enrolled
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition">
                                    Select
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No student found matching "{searchQuery}". You can switch to "Onboard New Student" above to add them!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Onboard New Student Form */
                  <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-600">
                      Enter student details. An account will automatically be created and granted immediate access to this exam!
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
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Validity Selection */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Access Validity / Plan Duration
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {validityType === "lifetime"
                        ? "Unlimited Lifetime"
                        : validityType === "date"
                        ? `Expires: ${formatSelectedDate(expiryDate)}`
                        : `${validityMonths} Months from today`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setValidityType("lifetime")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        validityType === "lifetime"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Lifetime Access
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidityType("date")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        validityType === "date"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Select Date (Calendar)
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidityType("months")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        validityType === "months"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Quick Months
                    </button>
                  </div>

                  {validityType === "date" && (
                    <div className="pt-2 flex items-center gap-3">
                      <input
                        type="date"
                        min={getTodayDateString()}
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {validityType === "months" && (
                    <div className="pt-2 flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={validityMonths}
                        onChange={(e) => setValidityMonths(Number(e.target.value) || 1)}
                        className="w-24 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-600 font-medium">Months of access from today</span>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGranting}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isGranting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Granting Access...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Grant Exam Access Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Link Video Courses Tab (Dynamic Automated Access) */}
            {activeTab === "courses" && (
              <div className="space-y-4">
                {/* Information Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200/80 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-200">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">
                            Dynamic Video Course Linking
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                          Link this exam package to one or more video courses. <strong>All current students</strong> and <strong>all future purchasers</strong> of selected courses automatically get free access to take these mock tests without any manual granting needed.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 bg-white/90 backdrop-blur px-3.5 py-2 rounded-xl border border-purple-200 text-xs shadow-xs self-stretch sm:self-auto justify-between sm:justify-start">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Active Coverage
                        </div>
                        <div className="text-xs font-black text-purple-700 flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5" />
                          ~{estimatedStudentsCount} Students
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search courses by title..."
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleSelectAllCourses}
                      className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllCourses}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Course List */}
                {isLoadingLinkedCourses ? (
                  <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
                    Loading video courses...
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border border-dashed rounded-xl bg-slate-50/50">
                    {courseSearchQuery
                      ? "No course matches your search query."
                      : "No courses found in database."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto custom-scrollbar p-1">
                    {filteredCourses.map((course) => {
                      const isSelected = selectedCourseIds.includes(String(course._id));
                      return (
                        <div
                          key={course._id}
                          onClick={() => handleToggleCourse(course._id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-purple-50/80 border-purple-300 shadow-sm ring-1 ring-purple-300"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          {/* Checkbox Icon */}
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>

                          {/* Course Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {course.thumbnail ? (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-5 h-5 text-slate-400" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {course.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-bold text-slate-700">
                                {course.amount > 0 ? `₹${course.amount}` : "Free"}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Users className="w-3 h-3 text-emerald-600" />
                                {course.enrolledStudents || 0} Students
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Save Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 bg-white sticky bottom-0">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-bold text-slate-900">
                      {selectedCourseIds.length} course{selectedCourseIds.length === 1 ? "" : "s"} selected
                    </span>
                    <span>•</span>
                    <span className="text-purple-700 font-bold">
                      ~{estimatedStudentsCount} students eligible
                    </span>
                    {hasCourseChanges && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        Unsaved Changes
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLinkedCourses}
                      disabled={isUpdatingLinkedCourses || !hasCourseChanges}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingLinkedCourses ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Links...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Save Linked Courses
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enrolled Students List Tab */}
            {activeTab === "students" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Filter enrolled students..."
                      value={studentSearchFilter}
                      onChange={(e) => setStudentSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
                    Total Enrolled: <span className="text-emerald-700 font-bold">{enrolledStudents.length}</span>
                  </div>
                </div>

                {isLoadingEnrolled ? (
                  <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                    Loading enrolled students...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border border-dashed rounded-xl bg-slate-50/50">
                    {studentSearchFilter
                      ? "No student matches your filter search."
                      : "No students currently have access to this exam package."}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar shadow-sm">
                    <table className="w-full min-w-[650px] text-xs text-left">
                      <thead className="bg-slate-100 uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Student Name</th>
                          <th className="px-4 py-3 font-semibold">Email & Phone</th>
                          <th className="px-4 py-3 font-semibold">Enrolled On</th>
                          <th className="px-4 py-3 font-semibold">Validity / Plan</th>
                          <th className="px-4 py-3 font-semibold">Access Type</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s) => (
                          <tr key={s._id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  {s.name?.charAt(0)}
                                </div>
                                {s.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <div>{s.email}</div>
                              {s.mobileNo ? (
                                <div className="text-[11px] text-slate-400">{s.mobileNo}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {s.enrolledAt
                                ? new Date(s.enrolledAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {s.planDuration || "Lifetime Access"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  s.grantType === "Admin Granted"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                {s.grantType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditExpiry(s)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                  title="Edit / Extend Validity"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentToRevoke(s)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Revoke Access"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Expiry Modal Sub-Overlay */}
          {editingStudent && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
              <div
                className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-indigo-600" />
                    Edit Validity for {editingStudent.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDurationType("lifetime")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        editDurationType === "lifetime"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Lifetime
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDurationType("date")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        editDurationType === "date"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Calendar Date
                    </button>
                  </div>

                  {editDurationType === "date" && (
                    <div className="space-y-2">
                      <input
                        type="date"
                        min={getTodayDateString()}
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditExpiry}
                    disabled={isUpdatingExpiry}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    {isUpdatingExpiry ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Revoke Student Access Confirmation Modal */}
          <DeleteAlertbox
            isOpen={!!studentToRevoke}
            itemName={`${studentToRevoke?.name}'s access to ${currentExam.title}`}
            isDeleting={isRevoking}
            onCancel={() => setStudentToRevoke(null)}
            onConfirm={handleConfirmRevoke}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GrantExamAccessDialog;
