export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-border ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-4">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="border-b border-border px-[14px] py-[14px]">
          <Skeleton className="h-3 w-full max-w-[100px]" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border-[1.5px] border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="mt-3 h-7 w-full rounded-md" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-[11px] border-b border-border px-[18px] py-[10px]">
      <Skeleton className="h-8 w-8 rounded-[7px]" />
      <div className="flex-1">
        <Skeleton className="mb-1 h-3 w-28" />
        <Skeleton className="h-2 w-20" />
      </div>
      <div className="text-right">
        <Skeleton className="mb-1 h-4 w-12 ml-auto" />
        <Skeleton className="h-4 w-14 ml-auto" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-fadeIn">
      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Orders + sidebar */}
      <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[10px] border border-border bg-surface">
          <div className="border-b border-border px-[18px] py-[14px]">
            <Skeleton className="h-4 w-28" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-[10px] border border-border bg-surface p-4">
            <Skeleton className="mb-3 h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-4">
            <Skeleton className="mb-3 h-4 w-20" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface">
      <table className="w-full">
        <thead>
          <tr>
            {["Order ID", "Table", "Items", "Total", "Assigned", "Placed At", "Status", ""].map((h) => (
              <th key={h} className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={8} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
