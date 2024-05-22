# blinkist-scraper

Use Playwright to download blinkist.com book summaries (text and audio).

Usage:
1. `npm install`
2. `npx .`

For now only goes through https://www.blinkist.com/en/app/library/saved


### Alternatives

https://github.com/leoncvlt/blinkist-scraper

> Python tool to download book summaries and audio from Blinkist.com, and generate some pretty output

> This script uses ChromeDriver to automate the Google Chrome browser - therefore Google Chrome needs to be installed in order to work.

Tried, but only failed with exceptions:

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
