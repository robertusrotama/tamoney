import { Bone, ListBones, LoadingLabel, TitleBones } from "@/components/ui/Skeleton";

/** Mirrors the budget page: title, period card, pos list. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <LoadingLabel />
      <TitleBones action />
      <Bone className="h-[236px] rounded-[14px]" />
      <ListBones rows={6} />
    </div>
  );
}
