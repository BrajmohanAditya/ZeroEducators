import React, { useState } from "react";
import { Edit, Trash2, Users, BookOpen, GraduationCap, Briefcase, Loader2 } from "lucide-react";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import QualifiedMentorDialog from "../../components/Admin/qualifiedMentor.dialog.jsx";
import { useGetQualifiedMentorsHook, useDeleteQualifiedMentorHook } from "../../hooks/qualifiedMentors.hook.js";

const QualifiedMentors = () => {
  const { data: mentorsResp, isLoading } = useGetQualifiedMentorsHook();
  const { mutate: deleteMentor, isPending: isDeleting } = useDeleteQualifiedMentorHook();
  
  const mentorsData = mentorsResp?.mentors || [];
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedImagePopup, setSelectedImagePopup] = useState(null);
  const [editingMentor, setEditingMentor] = useState(null);

  const handleDelete = (id, name) => {
    setDeleteConfirm({ id, name });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Qualified Mentors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View, edit, and manage your expert faculty and mentors.
          </p>
        </div>
        {/* Add Mentor Dialog */}
        <QualifiedMentorDialog 
          editingMentor={editingMentor} 
          onCloseEdit={() => setEditingMentor(null)} 
        />
      </div>

      {/* Admin List Section */}
      <div className="w-full max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4 whitespace-nowrap">Mentor</th>
                  <th className="p-4 whitespace-nowrap">Subject</th>
                  <th className="p-4 whitespace-nowrap">Qualifications</th>
                  <th className="p-4 whitespace-nowrap">Experience</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mentorsData.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => setSelectedImagePopup(item.imageUrl)}
                            />
                          ) : (
                            <Users className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex flex-col max-w-[250px]">
                          <div className="font-semibold text-slate-900 line-clamp-1">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{item.subject}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-slate-800">{item.qualifications}</span>
                      </div>
                    </td>

                    <td className="p-4">
                       <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Briefcase className="w-3 h-3" />
                          {item.experience}
                       </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMentor(item);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Mentor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item._id, item.name);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Mentor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty State Desktop */}
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading mentors...
                    </td>
                  </tr>
                ) : mentorsData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500">
                      No mentors found. Click "+ Add Mentor" to add your first
                      one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View (Hidden on desktop) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {mentorsData.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => setSelectedImagePopup(item.imageUrl)}
                    />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="font-semibold text-slate-900 text-base leading-tight line-clamp-2">
                    {item.name}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                      {item.experience}
                    </span>
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {item.subject}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Card Stats */}
              <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-2 text-sm border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Qualifications</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-yellow-500"/>
                    {item.qualifications}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMentor(item);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item._id, item.name);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}

          {/* Empty State Mobile */}
          {isLoading ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading mentors...
            </div>
          ) : mentorsData.length === 0 && (
            <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-500 shadow-sm">
              No mentors found. Click "+ Add Mentor" to add your first one!
            </div>
          )}
        </div>
      </div>

      <DeleteAlertbox
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name}
        isDeleting={isDeleting}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
            deleteMentor(deleteConfirm.id, {
                onSuccess: () => {
                    setDeleteConfirm(null);
                }
            });
        }}
      />

      {/* Image Popup Modal */}
      {selectedImagePopup && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImagePopup(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImagePopup} 
              alt="Mentor Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              onClick={() => setSelectedImagePopup(null)}
              className="absolute -top-4 -right-4 bg-white text-slate-800 rounded-full p-1.5 shadow-md hover:bg-slate-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualifiedMentors;
