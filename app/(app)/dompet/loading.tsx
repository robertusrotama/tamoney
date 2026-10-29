import { Bone, LoadingLabel } from "@/components/ui/Skeleton";

/** Mirrors the wallet page: title + total, then one card stack per wallet type side by side. */
export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingLabel />
      <div className="space-y-2 px-1">
        <Bone className="h-8 w-32" />
        <Bone className="mt-3 h-3 w-24" />
        <Bone className="h-11 w-64" />
      </div>
      <div className="flex gap-5 overflow-hidden">
        {[3, 3, 1].map((n, i) => (
          <div key={i} className="w-[min(300px,82vw)] shrink-0 space-y-2.5">
            <Bone className="h-5 w-28" />
            <Bone className="h-[212px] rounded-[16px]" />
            <div className="space-y-1">
              {Array.from({ length: n - 1 }, (_, j) => (
                <Bone key={j} className="h-[62px] rounded-[16px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
