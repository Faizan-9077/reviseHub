import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 relative text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-white/90 mt-1 text-sm sm:text-base">{subtitle}</p>}
        {action && <div className="mt-3 md:hidden">{action}</div>}
        {action && (
          <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}


