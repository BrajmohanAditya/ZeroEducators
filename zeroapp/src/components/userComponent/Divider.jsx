import React from 'react';

const Divider = ({ text = "OR" }) => {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="h-px flex-1 bg-gray-300"></div>
      <span className="text-sm text-gray-500 font-medium">{text}</span>
      <div className="h-px flex-1 bg-gray-300"></div>
    </div>
  );
};

export default Divider;
