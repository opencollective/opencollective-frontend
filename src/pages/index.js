import Link from 'next/link'

export default () => (
  <ul>
    <li><Link href='/event?collectiveSlug=brusselstogether&eventSlug=meetup-2' as='/brusselstogether/events/meetup-1'><a>brusselstogether meetup 2</a></Link></li>
    <li><Link href='/event?collectiveSlug=opencollective&eventSlug=meetup-1' as='/brusselstogether/events/meetup-1'><a>opencollective meetup 1</a></Link></li>
  </ul>
)