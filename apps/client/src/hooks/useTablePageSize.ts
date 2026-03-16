import { useCallback, useRef, useState } from "react";

interface UseTablePageSizeOptions {
  rowHeight?: number;
  headerHeight?: number;
  paginationHeight?: number;
  minRows?: number;
  maxRows?: number;
}

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export function useTablePagination(options: UseTablePageSizeOptions = {}) {
  const { rowHeight = 52, headerHeight = 48, paginationHeight = 52, minRows = 5, maxRows = 100 } = options;

  const [pagination, setPagination] = useState<PaginationState>(() => ({ pageIndex: 0, pageSize: minRows }));
  const observerRef = useRef<ResizeObserver | null>(null);

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      const calculatePageSize = () => {
        const availableHeight = node.clientHeight - headerHeight - paginationHeight;
        const possibleRows = Math.floor(availableHeight / rowHeight);
        const clampedRows = Math.max(minRows, Math.min(possibleRows, maxRows));

        setPagination((prev) => (prev.pageSize === clampedRows ? prev : { ...prev, pageSize: clampedRows }));
      };

      calculatePageSize();

      observerRef.current = new ResizeObserver(calculatePageSize);
      observerRef.current.observe(node);
    },
    [rowHeight, headerHeight, paginationHeight, minRows, maxRows],
  );

  return { containerRef, pagination, setPagination };
}
