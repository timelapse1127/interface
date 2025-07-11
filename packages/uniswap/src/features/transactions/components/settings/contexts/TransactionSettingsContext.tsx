import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectTransactionSettings } from 'uniswap/src/features/transactions/components/settings/selectors'
import type {
  TransactionSettingKey,
  TransactionSettingsState,
} from 'uniswap/src/features/transactions/components/settings/slice'
import { setTransactionSettings } from 'uniswap/src/features/transactions/components/settings/slice'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type TransactionSettingsContextState = {
  updateTransactionSettings: (newState: Partial<TransactionSettingsState>) => void
} & TransactionSettingsState

export const TransactionSettingsContext = createContext<TransactionSettingsContextState | undefined>(undefined)

export function TransactionSettingsContextProvider({
  settingKey,
  children,
  autoSlippageTolerance,
}: {
  children: ReactNode
  settingKey: TransactionSettingKey
  autoSlippageTolerance?: TransactionSettingsState['autoSlippageTolerance']
}): JSX.Element {
  const appDispatch = useDispatch()
  const transactionSettings = useSelector(selectTransactionSettings(settingKey))
  const v4HooksToggleFFEnabled = useFeatureFlag(FeatureFlags.SwapSettingsV4HooksToggle)

  const updateTransactionSettings = useCallback(
    (newState: Partial<TransactionSettingsState>): void => {
      appDispatch(setTransactionSettings({ settingKey, ...newState }))
    },
    [settingKey, appDispatch],
  )

  useEffect(() => {
    logContextUpdate('TransactionSettingsContext', transactionSettings)
  }, [transactionSettings])

  useEffect(() => {
    updateTransactionSettings({ autoSlippageTolerance })
  }, [autoSlippageTolerance, updateTransactionSettings])

  const state = useMemo<TransactionSettingsContextState>(
    (): TransactionSettingsContextState => ({
      ...transactionSettings,
      updateTransactionSettings,
      selectedProtocols: transactionSettings.selectedProtocols,
      isV4HookPoolsEnabled: v4HooksToggleFFEnabled ? transactionSettings.isV4HookPoolsEnabled : false,
    }),
    [transactionSettings, updateTransactionSettings, v4HooksToggleFFEnabled],
  )

  return <TransactionSettingsContext.Provider value={state}>{children}</TransactionSettingsContext.Provider>
}

export const useTransactionSettingsContext = (): TransactionSettingsContextState => {
  const swapContext = useContext(TransactionSettingsContext)

  if (swapContext === undefined) {
    throw new Error('`useTransactionSettingsContext` must be used inside of `TransactionSettingsContextProvider`')
  }

  return swapContext
}
