import { useRef, useState, useLayoutEffect } from "react";

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

	const containerRef = useRef<HTMLDivElement>(null);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: minRows });

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const calculatePageSize = () => {
			const availableHeight = container.clientHeight - headerHeight - paginationHeight;
			const possibleRows = Math.floor(availableHeight / rowHeight);
			const clampedRows = Math.max(minRows, Math.min(possibleRows, maxRows));

			setPagination((prev) => (prev.pageSize === clampedRows ? prev : { ...prev, pageSize: clampedRows }));
		};

		calculatePageSize();

		const resizeObserver = new ResizeObserver(calculatePageSize);
		resizeObserver.observe(container);

		return () => resizeObserver.disconnect();
	}, [rowHeight, headerHeight, paginationHeight, minRows, maxRows]);

	return { containerRef, pagination, setPagination };
}
