import { useParams, action, useAction, useSubmission } from '@solidjs/router'

const loadAction = action(async (id: string) => {
  const result = await (await fetch(`/saved/${id}/book.json`)).json()
  console.log(result)
  return result.title
})

const Book = () => {
  // return (
  //   <div>
  //     <a href={book.id} class="flex justify-center">
  //       <img src={book.img} alt={book.title} class="shadow hover:shadow-xl" /> {/* border-solid border-blue-500 hover:border-2 */}
  //     </a>
  //     <div class="text-xs text-slate-400 flex justify-between leading-6 font-medium tabular-nums">
  //       <div> {book.duration} min </div>
  //       <div> {book.rating} ⭐︎ </div>
  //     </div>
  //     <div> {book.title} </div>
  //     <div class="text-xs text-slate-400"> {book.author} </div>
  //     {/* <a href={book.url} target="_blank" rel="noreferrer"> */}
  //     {/*   <ExternalLink /> */}
  //     {/* </a> */}
  //   </div>
  // )
  const params = useParams()
  const load = useAction(loadAction)
  const book = useSubmission(loadAction)
  load(params.id)
  console.log(book.pending, book.result)
  return <div>Book ID: {params.id}; fetch result: {book.pending ? 'Loading' : book.result}</div>
}

export default Book
