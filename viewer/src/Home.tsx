import { createSignal } from 'solid-js'
// https://lucide.dev/icons
// import { ExternalLink } from 'lucide-solid' // this made `npm run dev` load all icons and just show a blank page since fingerprint.jsx was blocked by uBlock; see https://github.com/lucide-icons/lucide/issues/1675#issuecomment-2147119821
// import ExternalLink from './icons/ExternalLink.svg' // works, but then need to copy each svg and use <img src={ExternalLink} /> instead of just <ExternalLink /> which also missed proper styling (black instead of blue) when e.g. used in <a>
import ExternalLink from 'lucide-solid/icons/external-link'

// https://medium.com/@akshaykrdas001/how-to-fetch-data-from-local-json-file-and-render-it-to-html-document-with-using-vanilla-javascript-a0191a894f25
// can load local images via <img> without webserver, but no local .js or .json files via <script>, import or fetch() -> bundler could inline db.json during build, but would still need to load */book.json dynamically or put everything in db.json
// -> just use `npm run dev` for now

// import json from './db.json' // bundler can import if file is copied to src
// however, we need to serve */book.json anyway, so we also just fetch the overview json
const db = await (await fetch('/db.json')).json()

export type book = {
  id: string,
  title: string,
  author: string,
  description: string,
  duration: number,
  rating: number,
  url: string,
  img: string,
}

const _example : book = {
  "id": "das-ende-der-armut-de",
  "title": "Das Ende der Armut",
  "author": "Jeffrey D. Sachs",
  "description": "Ein ökonomisches Programm für eine gerechtere Welt",
  "duration": 21,
  "rating": 4.4,
  "url": "https://www.blinkist.com/en/app/books/das-ende-der-armut-de",
  "img": "https://images.blinkist.io/images/books/50d72a26e4b045383aa45e20/1_1/640.png"
}

const Book = (book: book) => {
  return (
    <div>
      <a href={`/book/${book.id}`} class="flex justify-center">
        <img src={book.img} alt={book.title} class="shadow hover:shadow-xl" /> {/* border-solid border-blue-500 hover:border-2 */}
      </a>
      <div class="text-xs text-slate-400 flex justify-between leading-6 font-medium tabular-nums">
        <div> {book.duration} min </div>
        <div> {book.rating} ⭐︎ </div>
      </div>
      <div> {book.title} </div>
      <div class="text-xs text-slate-400"> {book.author} </div>
      {/* <a href={book.url} target="_blank" rel="noreferrer"> */}
      {/*   <ExternalLink /> */}
      {/* </a> */}
    </div>
  )
}

const gridCols = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6', 'grid-cols-7', 'grid-cols-8', 'grid-cols-9', 'grid-cols-10'] // tailwind compiler needs to be able to extract classnames, so we can't just dynamically concatenate as string...

function App() {
  const [cols, setCols] = createSignal(5) // grid-cols-n

  return (
    <>
      <p class="text-slate-600">
        Saved: {db.saved.length} |
        Finished: {db.finished.length}
      </p>
      Columns:
      <button disabled={cols()<=1} onClick={() => setCols(x => x - 1)}> - </button>
      {cols()}
      <button disabled={cols()>=gridCols.length} onClick={() => setCols(x => x + 1)}> + </button>
      <div class={`m-8 grid grid-flow-row ${gridCols[(cols()-1) % gridCols.length]} gap-8`}>
        {db.saved.slice(-10).map(Book)}
      </div>
    </>
  )
}

export default App
