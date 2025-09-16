import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-40" />
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <Card>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-80" /></CardContent>
          </Card>
        </div>
        <div className="xl:col-span-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-80" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
