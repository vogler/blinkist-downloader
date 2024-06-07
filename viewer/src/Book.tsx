// https://docs.solidjs.com/guides/fetching-data
import { createResource, Suspense, Switch, Match, For } from "solid-js";
import { useParams } from '@solidjs/router'

const fetchBook = async (id: string) => {
  const response = await fetch(`/saved/${id}/book.json`)
  console.log('fetchBook', id, response.ok, response.status)
  return response.json()
}

import type { book } from './Home'
type chapter = {
  name: string,
  title: string,
  text: string,
  audio: string
}
type book_details = {
  ratings: string,
  durationDetail: string,
  categories: string[],
  descriptionLong: string,
  authorDetails: string,
  contentState: {
    progress: number,
    addedToLibraryAt: string,
    lastConsumedAt: string,
    firstCompletetedAt: string
  },
  downloadDate: string,
  orgChapter: string,
  chapters: chapter[]
}
type book_full = book & book_details

const Book = (book: book_full) => {
  return (
    <>
      <a href={book.url} target="_blank" rel="noreferrer" class="flex justify-center">
        <img src={book.img} alt={book.title} class="shadow" />
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

      <div> {book.durationDetail} </div>
      <div> {book.ratings} </div>
      <dt>Short description</dt>
      <div> {book.description} </div>
      <hr />
      <dt>Long description</dt>
      <div innerHTML={book.descriptionLong}> </div>
      <hr />
      <dt>About the author</dt>
      <div innerHTML={book.authorDetails}> </div>
      <hr />
      <h1> Chapters </h1>
      <For each={book.chapters}>
        {(chapter: chapter) => (
          <>
            <h2>{chapter.title}</h2>
            <div innerHTML={chapter.text}> </div>
          </>
        )}
      </For>
    </>
  )
}

const BookLoader = () => {
  // return (
  //   <div>
  //   </div>
  // )
  const params = useParams()
  const id = params.id
  const [book] = createResource(id, fetchBook)
  console.log(book.error)
  // return <div>Book ID: {id}; fetch result: {book.loading ? 'Loading' : book.error ? `error: ${book.error}` : book()}</div>
  return (
    <div>
      <Suspense fallback={<div>Loading</div>}>
        <Switch>
          <Match when={book.error}>
            <span>Error: {book.error()}</span>
          </Match>
          <Match when={book()}>
            {/* <div>{JSON.stringify(book())}</div> */}
            <Book {...book()} />
          </Match>
        </Switch>
      </Suspense>
    </div>
  );
}

export default BookLoader
