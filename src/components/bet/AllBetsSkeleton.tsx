import { AllBetsStatsSkeleton } from './AllBetsStatsSkeleton'
import { BetsListSectionSkeleton } from './BetsListSectionSkeleton'

export function AllBetsSkeleton() {
  return (
    <>
      <AllBetsStatsSkeleton />
      <BetsListSectionSkeleton showGeneratedAt />
    </>
  )
}
