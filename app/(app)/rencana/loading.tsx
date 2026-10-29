import { Bone, ListBones, LoadingLabel } from "@/components/ui/Skeleton";

/** Mirrors Rencana: title, segmented control, summary, list. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <LoadingLabel />
      <Bone className="ml-1 h-8 w-40" />
      <Bone className="h-8 w-80 max-w-full rounded-[9px]" />
      <Bone className="h-24 w-64 rounded-[14px]" />
      <ListBones rows={4} />
    </div>
  );
}
