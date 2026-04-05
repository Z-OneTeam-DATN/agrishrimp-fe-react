"use client";

import { useEffect, useState } from "react";

type ResponsiveColumnsConfig = {
  defaultColumns: number;
  smColumns?: number;
  mdColumns?: number;
  lgColumns?: number;
  xlColumns?: number;
};

function resolveColumns(width: number, config: ResponsiveColumnsConfig) {
  if (config.xlColumns && width >= 1280) return config.xlColumns;
  if (config.lgColumns && width >= 1024) return config.lgColumns;
  if (config.mdColumns && width >= 768) return config.mdColumns;
  if (config.smColumns && width >= 640) return config.smColumns;
  return config.defaultColumns;
}

export function useResponsiveColumns(config: ResponsiveColumnsConfig) {
  const [columns, setColumns] = useState(config.defaultColumns);

  useEffect(() => {
    const updateColumns = () => {
      setColumns(resolveColumns(window.innerWidth, config));
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);

    return () => window.removeEventListener("resize", updateColumns);
  }, [
    config.defaultColumns,
    config.smColumns,
    config.mdColumns,
    config.lgColumns,
    config.xlColumns,
  ]);

  return columns;
}
