# blinkist-downloader

Uses Playwright to download book summaries (text and audio) from blinkist.com.

Usage:
1. Install https://nodejs.org
1. Clone this repository and `cd` into it
1. `npm install`
1. `npm start`

What will it do?
1. Go through https://www.blinkist.com/en/app/library/saved and https://www.blinkist.com/en/app/library/finished
to check for newly added books to these lists and save them to `data/db.json`.
1. Go through all books from `data/db.json` and download their text (`book.json`) and audio (each chapter as `.m4a`) to `data/books`.

A book summary including audio is around 20MB depending on its length.

Caveat: Downloading a book will also put it in blinkist's finished list (despite resetting it to the beginning) and I've found no way of removing books from the list. To avoid having the same book downloaded both as saved and finished, only books that are not in saved will be added to finished.

Example:
```console
$ ls data/books/saved/how-to-avoid-a-climate-disaster-en
 Introduction.m4a  'Key idea 2.m4a'  'Key idea 4.m4a'  'Key idea 6.m4a'  'Key idea 8.m4a'   book.json
'Key idea 1.m4a'   'Key idea 3.m4a'  'Key idea 5.m4a'  'Key idea 7.m4a'   Summary.m4a       cover.png
```
```json
{
  "id": "how-to-avoid-a-climate-disaster-en",
  "title": "How to Avoid a Climate Disaster",
  "author": "Bill Gates",
  "description": "The Solutions We Have and the Breakthroughs We Need",
  "duration": 30,
  "rating": 4.6,
  "url": "https://www.blinkist.com/en/app/books/how-to-avoid-a-climate-disaster-en",
  "img": "https://images.blinkist.io/images/books/604241286cee070007be7d17/1_1/640.png",
  "ratings": "4.5 (456 ratings)",
  "durationDetail": "30 mins",
  "categories": [
    "Technology & the Future",
    "Nature & the Environment"
  ],
  "descriptionLong": "<p><em>How to Avoid a Climate Disaster </em>(2021) is a guidebook to getting the world to an important milestone: zero greenhouse gas emissions. Bill Gates shares the knowledge he’s gained through his role on international climate commissions and as a go-to source of funding for climate solution startups. He pinpoints the ideas that show the most promise and explains the work that still needs to be done.&nbsp;</p>",
  "authorDetails": "<p>Bill Gates is a business leader, philanthropist, and cofounder of Microsoft. Along with his wife, he is the cochair of the Bill &amp; Melinda Gates Foundation, which is dedicated to fighting poverty and related health issues around the world. He is also a founder of Breakthrough Energy, a group of organizations that strive to push forward clean energy products and initiatives.</p>",
  "contentState": {
    "progress": 0,
    "addedToLibraryAt": "2024-05-22T22:49:09.000Z",
    "lastConsumedAt": null,
    "firstCompletedAt": null
  },
  "downloadDate": "2024-05-22T23:24:33.238Z",
  "orgChapter": "Introduction",
  "chapters": [...]
}
```

TODO: UI to view downloaded books.


### Log

Tried https://github.com/leoncvlt/blinkist-scraper, but only failed with exceptions.

<details>
<summary>Details</summary>

> Python tool to download book summaries and audio from Blinkist.com, and generate some pretty output

> This script uses ChromeDriver to automate the Google Chrome browser - therefore Google Chrome needs to be installed in order to work.


```
bs ❯  python3 blinkistscraper <email> <password>
[23:24:59] INFO Starting scrape run...
[23:24:59] INFO Initialising chromedriver at None...
[23:24:59] ERROR expected str, bytes or os.PathLike object, not NoneType
Traceback (most recent call last):
  File "/Users/voglerr/blinkist-scraper/blinkistscraper/__main__.py", line 412, in <module>
    main()
  File "/Users/voglerr/blinkist-scraper/blinkistscraper/__main__.py", line 319, in main
    driver = scraper.initialize_driver(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/voglerr/blinkist-scraper/blinkistscraper/scraper.py", line 98, in initialize_driver
    driver = webdriver.Chrome(
             ^^^^^^^^^^^^^^^^^
  File "/Users/voglerr/blinkist-scraper/bs/lib/python3.11/site-packages/seleniumwire/webdriver/browser.py", line 96, in __init__
    super().__init__(*args, **kwargs)
  File "/Users/voglerr/blinkist-scraper/bs/lib/python3.11/site-packages/selenium/webdriver/chrome/webdriver.py", line 73, in __init__
    self.service.start()
  File "/Users/voglerr/blinkist-scraper/bs/lib/python3.11/site-packages/selenium/webdriver/common/service.py", line 72, in start
    self.process = subprocess.Popen(cmd, env=self.env,
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/homebrew/Cellar/python@3.11/3.11.6_1/Frameworks/Python.framework/Versions/3.11/lib/python3.11/subprocess.py", line 1026, in __init__
    self._execute_child(args, executable, preexec_fn, close_fds,
  File "/opt/homebrew/Cellar/python@3.11/3.11.6_1/Frameworks/Python.framework/Versions/3.11/lib/python3.11/subprocess.py", line 1824, in _execute_child
    and os.path.dirname(executable)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen posixpath>", line 152, in dirname
TypeError: expected str, bytes or os.PathLike object, not NoneType
[23:24:59] CRITICAL Uncaught Exception. Exiting...
```
</details>
