import { Bone, ListBones, LoadingLabel, TitleBones } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingLabel />
      <TitleBones action />
      <div className="grid gap-4 rounded-[14px] bg-card p-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-36" />
            <Bone className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-[260px] rounded-[14px]" />
        </div>
        <div className="space-y-2">
          <Bone className="h-5 w-24" />
          <Bone className="h-[260px] rounded-[14px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Bone className="h-5 w-20" />
        <Bone className="h-11 rounded-[10px]" />
        <ListBones rows={6} />
      </div>
    </div>
  );
}
