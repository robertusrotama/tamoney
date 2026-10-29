import { Bone, ListBones, LoadingLabel, TitleBones } from "@/components/ui/Skeleton";

/** Ringkasan (and the fallback for any app page): mirrors the dashboard layout so nothing jumps on load. */
export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingLabel />
      <TitleBones />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <div className="space-y-4 rounded-[14px] bg-card p-5">
            <Bone className="h-3 w-20" />
            <Bone className="h-11 w-60" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Bone className="h-10" />
              <Bone className="h-10" />
            </div>
            <Bone className="h-1.5 rounded-full" />
          </div>
          <div className="space-y-2">
            <Bone className="h-5 w-24" />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <Bone key={i} className="h-[92px] w-40 shrink-0 rounded-[14px]" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-5 w-24" />
            <ListBones rows={3} />
          </div>
        </div>
        <div className="hidden space-y-2 lg:block">
          <Bone className="h-5 w-32" />
          <Bone className="h-[420px] rounded-[14px]" />
        </div>
      </div>
    </div>
  );
}
