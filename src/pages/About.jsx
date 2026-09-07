import { Link } from 'react-router-dom'
export default function About() {
  return <section className="sec"><div className="wrap prose">
    <h1>Azteca del Golfo Fishing Club</h1>
    <p>We're a group of sport anglers who fish the waters of the Gulf of Mexico off the Texas coast. The club started among friends who shared a boat, bait and early mornings, and today it brings together members from across the Houston area.</p>
    <h2>What we do</h2>
    <ul><li>Monthly group trips, inshore and offshore.</li><li>Club tournaments with categories by species and prizes for the biggest catch of the year.</li><li>An annual catch leaderboard validated by the board.</li><li>A photo and video gallery where every member documents their trips.</li><li>Meetings to share spots, techniques and gear maintenance.</li></ul>
    <h2>Membership</h2>
    <p>Applications are submitted online and approved by the board. Once active, a member can post to the gallery, log catches and sign up for tournaments and trips.</p>
    <h2>Club rules</h2>
    <ul><li>Respect Texas Parks &amp; Wildlife minimum sizes, closed seasons and bag limits. Every member is responsible for their own fishing license.</li><li>Every catch entered on the leaderboard needs a photo with a scale or tape measure and the date of the catch.</li><li>Safety first: life jackets, a VHF radio and a float plan on every trip.</li><li>Posts must be your own and fishing-related. The board may reject content that doesn't meet this bar.</li><li>Catch and release whenever the species or the size calls for it.</li></ul>
    <p><Link className="btn" to="/join">Apply for membership</Link></p>
  </div></section>
}
