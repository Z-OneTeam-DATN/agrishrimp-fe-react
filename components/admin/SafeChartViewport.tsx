"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type ChartSize = {
  height: number;
  width: number;
};

type SafeChartViewportProps = {
  children: (size: ChartSize) => ReactNode;
  className: string;
  minHeight?: number;
  minWidth?: number;
};

const isValidSize = (size: ChartSize, minWidth: number, minHeight: number) =>
  Number.isFinite(size.width) &&
  Number.isFinite(size.height) &&
  size.width >= minWidth &&
  size.height >= minHeight;

export default function SafeChartViewport({
  children,
  className,
  minHeight = 24,
  minWidth = 24,
}: SafeChartViewportProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ChartSize | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frameId: number | null = null;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = {
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      };

      setSize((current) => {
        if (!isValidSize(nextSize, minWidth, minHeight)) {
          return current === null ? current : null;
        }

        return current?.width === nextSize.width &&
          current?.height === nextSize.height
          ? current
          : nextSize;
      });
    };

    const scheduleMeasure = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [minHeight, minWidth]);

  return (
    <div ref={ref} className={className}>
      {size ? children(size) : null}
    </div>
  );
}
