import { Bone, ListBones, LoadingLabel } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingLabel />
      <div className="space-y-3 px-1">
        <Bone className="h-5 w-24" />
        <div className="flex items-center gap-3">
          <Bone className="size-11 rounded-[12px]" />
          <Bone className="h-8 w-48" />
        </div>
      </div>
      <Bone className="h-[104px] rounded-[14px]" />
      <div className="space-y-2">
        <Bone className="h-5 w-28" />
        <Bone className="h-[212px] rounded-[14px]" />
      </div>
      <div className="space-y-2">
        <Bone className="h-11 rounded-[10px]" />
        <ListBones rows={5} />
      </div>
    </div>
  );
}
