import { useEffect, useRef, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, callback: () => void, enabled = true) {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		if (!enabled) return;

		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				callbackRef.current();
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [ref, enabled]);
}
