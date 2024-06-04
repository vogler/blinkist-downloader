import { createSignal } from 'solid-js'
// https://lucide.dev/icons
// import { ExternalLink } from 'lucide-solid' // this made `npm run dev` load all icons and just show a blank page since fingerprint.jsx was blocked by uBlock; see https://github.com/lucide-icons/lucide/issues/1675#issuecomment-2147119821
// import ExternalLink from './icons/ExternalLink.svg' // works, but then need to copy each svg and use <img src={ExternalLink} /> instead of just <ExternalLink /> which also missed proper styling (black instead of blue) when e.g. used in <a>
import ExternalLink from 'lucide-solid/icons/external-link'
import './App.css'

// https://medium.com/@akshaykrdas001/how-to-fetch-data-from-local-json-file-and-render-it-to-html-document-with-using-vanilla-javascript-a0191a894f25
// can load local images via <img> without webserver, but no local .js or .json files via <script>, import or fetch() -> bundler could inline db.json during build, but would still need to load */book.json dynamically or put everything in db.json
// -> just use `npm run dev` for now

// import json from './db.json' // bundler can import if file is copied to src
// however, we need to serve */book.json anyway, so we also just fetch the overview json
const db = await (await fetch('/db.json')).json()

const [size, setSize] = createSignal(250) // book cover width

const Book = (book: any) => {
  return (
    <div class="card">
      <a href={book.id}>
        <img src={book.img} alt={book.title} width={size()} /> <br />
        {book.title}
      </a> &nbsp;
      <a href={book.url} target="_blank" rel="noreferrer">
        {/* blinkist */}
        <ExternalLink />
      </a>
    </div>
  )
}

function App() {
  return (
    <>
      <a href="https://github.com/vogler/blinkist-downloader"><h1>blinkist-downloader</h1></a>
      <p class="read-the-docs">
        Saved: {db.saved.length} |
        Finished: {db.finished.length}
      </p>
      <button onClick={() => setSize((size) => size - 20)}> - </button>
      <button onClick={() => setSize((size) => size + 20)}> + </button>
      {db.saved.slice(-10).map(Book)}
    </>
  )
}

export default App
