import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_GROUPS = [0, 1, 2];

export function GallerySkeleton() {
  return (
    <div className="space-y-7">
      {SKELETON_GROUPS.map((group) => (
        <section key={group}>
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="h-px min-w-6 flex-1 bg-border" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 2xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
