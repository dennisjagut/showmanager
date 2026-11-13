import { ListSkeleton } from "@/components/ui/Skeleton";

// Below the title and the tabs of the layout, which stay while a tab loads
export default function Loading() {
  return <ListSkeleton rows={4} height="h-14" />;
}
