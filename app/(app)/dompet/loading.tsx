import { Bone, ListBones, LoadingLabel, TitleBones } from "@/components/ui/Skeleton";

/** Mirrors the wallet page: card stack (front card + tucked strips) left, activity statement right. */
export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingLabel />
      <TitleBones action />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div>
          <Bone className="h-[212px] rounded-[16px]" />
          <div className="mt-3 space-y-1">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="h-[62px] rounded-[16px]" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Bone className="h-5 w-40" />
          <ListBones rows={7} />
        </div>
      </div>
    </div>
  );
}
