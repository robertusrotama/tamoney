import { Bone, ListBones, LoadingLabel, TitleBones } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingLabel />
      <TitleBones action />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="aspect-[1.586] rounded-[18px]" />
        ))}
      </div>
      <div className="space-y-2">
        <Bone className="h-5 w-36" />
        <ListBones rows={3} />
      </div>
    </div>
  );
}
