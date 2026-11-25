import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

const TabVisibilityContext = createContext<boolean>(true);

export const TabVisibilityProvider: React.FC<{
  isVisible: boolean;
  children: React.ReactNode;
}> = ({ isVisible, children }) => (
  <TabVisibilityContext.Provider value={isVisible}>
    {children}
  </TabVisibilityContext.Provider>
);

export const useTabVisibility = () => useContext(TabVisibilityContext);

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  isEmpty?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

/**
 * Visibility- and dimension-aware wrapper around Recharts ResponsiveContainer.
 * Ensures the parent container always has min-width: 0 and explicit positive dimensions
 * before mounting ResponsiveContainer, preventing width(0)/height(0) warnings across
 * hidden tabs, dynamic panels, and responsive viewports.
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  className = 'h-72',
  minHeight = 240,
  isEmpty = false,
  emptyMessage = 'No dataset available to display.',
  isLoading = false,
}) => {
  const isTabVisible = useTabVisibility();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!isTabVisible || isEmpty || isLoading || !el) {
      setSize((prev) => (prev.width === 0 && prev.height === 0 ? prev : { width: 0, height: 0 }));
      return;
    }

    const updateSize = (w: number, h: number) => {
      const nextWidth = Math.round(w);
      const nextHeight = Math.round(h);
      setSize((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    const rect = el.getBoundingClientRect();
    updateSize(rect.width, rect.height);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateSize(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [isTabVisible, isEmpty, isLoading]);

  const canRenderChart = isTabVisible && !isEmpty && !isLoading && size.width > 0 && size.height > 0;

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 relative ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-800 text-xs font-mono text-slate-500 dark:text-neutral-400">
          Loading chart data...
        </div>
      ) : isEmpty ? (
        <div className="w-full h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 text-xs font-mono text-slate-500 dark:text-neutral-400">
          {emptyMessage}
        </div>
      ) : canRenderChart ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={minHeight}
          initialDimension={{ width: size.width, height: size.height }}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full" style={{ minHeight: `${minHeight}px` }} aria-hidden="true" />
      )}
    </div>
  );
};
