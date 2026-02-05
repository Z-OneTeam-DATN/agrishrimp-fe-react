"use client";

import React from "react";

interface SettingsGridProps {
  children: React.ReactNode;
}

export const SettingsGrid = ({ children }: SettingsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
};
