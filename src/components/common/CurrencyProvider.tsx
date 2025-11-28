import {
  createContext,
  createSignal,
  type ParentComponent,
  useContext,
} from 'solid-js'
import { makePersisted } from '@solid-primitives/storage'

const useCurrencyHook = () => {

  const [currency, setCurrency] = makePersisted(
    createSignal<'GBP' | 'USD' | 'EUR'>('GBP'),
    {
      name: 'currency',
    }
  )
  return {
    currency, setCurrency
  }
}

interface CurrencyProps {
}

const CurrencyContext = createContext<ReturnType<typeof useCurrencyHook>>()

export const CurrencyProvider: ParentComponent<CurrencyProps> = (props) => {
  const hook = useCurrencyHook()
  return (
    <CurrencyContext.Provider value={hook}>
      {props.children}
    </CurrencyContext.Provider>
  )
}
export const useCurrency = () => useContext(CurrencyContext)!
