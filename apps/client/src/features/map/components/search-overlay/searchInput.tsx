import { type ReactNode, type RefObject, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils.js";
import { Spinner } from "@/components/ui/spinner.js";
import type { ParsedFilter } from "../../types.js";

type SearchInputProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  inputValue: string;
  parsedFilters: ParsedFilter[];
  isSearching: boolean;
  query: string;
  isFocused: boolean;
  mobileExpanded: boolean;
  filterSlot?: ReactNode;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onInputFocus: () => void;
  onInputClick: () => void;
  onRemoveFilter: (filter: ParsedFilter) => void;
  onClearSearch: () => void;
  onContainerBlur: (e: React.FocusEvent) => void;
  onMobileExpand: () => void;
  onMobileCollapse: () => void;
};

export function SearchInput({
  containerRef,
  inputRef,
  inputValue,
  parsedFilters,
  isSearching,
  query,
  isFocused,
  mobileExpanded,
  filterSlot,
  onInputChange,
  onKeyDown,
  onInputFocus,
  onInputClick,
  onRemoveFilter,
  onClearSearch,
  onContainerBlur,
  onMobileExpand,
  onMobileCollapse,
}: SearchInputProps) {
  const { t } = useTranslation(["main", "common"]);

  function handleContainerBlur(e: React.FocusEvent) {
    onContainerBlur(e);
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      onMobileCollapse();
    }
  }

  function handleMobileSearchClick() {
    onMobileExpand();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <search
      ref={containerRef}
      onBlur={handleContainerBlur}
      className={cn(
        "bg-background/95 backdrop-blur-md border rounded-2xl shadow-xl transition-all duration-200",
        isFocused && "ring-2 ring-primary/20 border-primary/30",
        !mobileExpanded && !isFocused && "md:w-auto w-fit ml-auto",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" className="md:pointer-events-none shrink-0" onClick={handleMobileSearchClick}>
          <HugeiconsIcon icon={Search01Icon} className="size-5 text-muted-foreground" />
        </button>

        <div className={cn("flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide", !mobileExpanded && !isFocused && "hidden md:flex")}>
          {parsedFilters.map((filter) => (
            <div
              key={filter.raw}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20 shrink-0"
            >
              <span className="font-mono text-xs whitespace-nowrap">{filter.key}:</span>
              <span className="text-xs whitespace-nowrap max-w-30 truncate" title={filter.value}>
                {filter.value}
              </span>
              <button onClick={() => onRemoveFilter(filter)} className="hover:bg-primary/20 rounded p-0.5 transition-colors ml-0.5" type="button">
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </button>
            </div>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onFocus={onInputFocus}
            onClick={onInputClick}
            placeholder={parsedFilters.length > 0 ? t("search.placeholderAddMore") : t("common:placeholder.search")}
            className="flex-1 min-w-25 bg-transparent text-base md:text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {isSearching && query.trim() !== "" && <Spinner className="size-4 text-primary shrink-0" />}

        {(query || parsedFilters.length > 0) && !isSearching && (
          <button
            onPointerDown={(e) => e.preventDefault()}
            onClick={onClearSearch}
            className={cn("p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0", !mobileExpanded && !isFocused && "hidden md:block")}
            type="button"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
          </button>
        )}

        {filterSlot}
      </div>
    </search>
  );
}
