import { getAllBets } from '../services/betStorageService'
import {
  useBetsListViewModel,
  type BetsListViewModelState,
  type BetsMatchGroup,
} from './useBetsListViewModel'

export type { BetsMatchGroup as AllBetsMatchGroup }

export type AllBetsViewModelState = Omit<BetsListViewModelState, 'removeBetLocally'>

export function useAllBetsViewModel(): AllBetsViewModelState {
  const viewModel = useBetsListViewModel({ fetchBets: getAllBets, includeChampionBets: true })

  return {
    groups: viewModel.groups,
    totalBets: viewModel.totalBets,
    totalExact: viewModel.totalExact,
    totalPartial: viewModel.totalPartial,
    totalMissed: viewModel.totalMissed,
    isLoading: viewModel.isLoading,
    error: viewModel.error,
    isEmpty: viewModel.isEmpty,
    reload: viewModel.reload,
  }
}
