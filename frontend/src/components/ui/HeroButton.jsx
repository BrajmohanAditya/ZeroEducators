import React from 'react';

export const TabButton = ({ active, onClick, icon: Icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );
};

export const RadioButton = ({ name, value, checked, onChange, label }) => {
  return (
    <label className="flex items-center cursor-pointer group">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600 cursor-pointer"
      />
      <span className="ml-2 text-slate-700 text-sm group-hover:text-slate-900">
        {label}
      </span>
    </label>
  );
};