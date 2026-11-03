// Costa Rica is UTC-06:00 year-round. The last day of phase 1 is inclusive.
export const PHASE_TWO_START = Date.parse('2026-11-17T00:00:00-06:00')
export const EVENT_DAY_START = Date.parse('2027-01-16T00:00:00-06:00')
export const ticketPhases = [
  { id: 'phaseOne', price: 10000 },
  { id: 'phaseTwo', price: 13500 },
  { id: 'eventDay', price: 16000 },
] as const

export function ticketPhaseAt(now: number) {
  return now >= EVENT_DAY_START ? 2 : now >= PHASE_TWO_START ? 1 : 0
}

export function formatTicketPrice(price: number) {
  return `₡${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
}
