import { Bone, ListBones, LoadingLabel } from "@/components/ui/Skeleton";

/** Mirrors Analitik: period tabs, search + filter pills, summary, history (left) + category donut (right). */
export default function Loading() {
  return (
    <div className="space-y-6">
      <LoadingLabel />
      <Bone className="ml-1 h-8 w-40" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Bone className="h-8 w-full rounded-[9px] sm:w-[400px]" />
        <Bone className="h-11 w-56 rounded-full" />
      </div>
      <Bone className="h-11 rounded-full" />
      <div className="flex gap-2">
        <Bone className="h-9 w-28 rounded-full" />
        <Bone className="h-9 w-28 rounded-full" />
        <Bone className="h-9 w-32 rounded-full" />
      </div>
      <Bone className="h-[104px] rounded-[14px]" />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-2 lg:order-2">
          <Bone className="h-5 w-24" />
          <Bone className="h-[360px] rounded-[14px]" />
        </div>
        <div className="space-y-2 lg:order-1">
          <Bone className="h-5 w-28" />
          <ListBones rows={8} />
        </div>
      </div>
    </div>
  );
}
