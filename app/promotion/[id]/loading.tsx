import { Skeleton } from "@/components/ui/skeleton"

export default function PromotionLoading() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <Skeleton className="h-6 w-24 mb-8" />

      <Skeleton className="h-[400px] w-full rounded-lg mb-2" />
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>

      <Skeleton className="h-10 w-3/4 mb-2" />
      <div className="flex flex-wrap gap-4 mb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-5 w-48 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>

          <div className="space-y-4 mb-6">
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-7 w-40 mb-2" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>

      <div className="mt-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
