import { Page } from "@/components/ui/Page";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Page width="narrow">
      <PageSkeleton rows={4} height="h-40" />
    </Page>
  );
}
