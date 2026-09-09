type Props = { character: 'pua' | 'vaca'; className?: string; priority?: boolean }

/** Independent poster characters, reusable against the festival's dark scenery. */
export default function FestivalCharacter({ character, className = '', priority = false }: Props) {
  return <img className={`festival-character ${className}`} src={`/images/characters/${character}.png`} alt="" aria-hidden="true" width="992" height="1584" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />
}
