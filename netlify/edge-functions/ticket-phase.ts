import { ticketPhaseAt } from '../../src/site/tickets.ts'

export default function ticketPhase(request: Request) {
  return new URL(`/ticket-phases/phase-${ticketPhaseAt(Date.now()) + 1}.html`, request.url)
}

export const config = { path: '/', onError: 'bypass' }
