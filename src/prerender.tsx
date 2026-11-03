import './i18n'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { TicketTimeContext } from './site/TicketPhase'
export { canonicalPaths, metadataFor } from './site/routes'
export { PHASE_TWO_START, EVENT_DAY_START } from './site/tickets'

export function render(path: string, now?: number) {
  return renderToString(<TicketTimeContext.Provider value={now}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></TicketTimeContext.Provider>)
}
