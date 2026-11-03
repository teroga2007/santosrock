import { createContext, useContext, useEffect, useState } from 'react'
import { ticketPhaseAt } from './tickets'

// Build-time variants supply a fixed date; live pages follow the visitor's clock.
export const TicketTimeContext = createContext<number | undefined>(undefined)

export function useTicketPhase() {
  const initialTime = useContext(TicketTimeContext)
  const [phase, setPhase] = useState(() => ticketPhaseAt(initialTime ?? Date.now()))
  useEffect(() => {
    const update = () => setPhase(ticketPhaseAt(Date.now()))
    update()
    const timer = window.setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return phase
}
