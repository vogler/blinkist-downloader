/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'

import './index.css'
import Home from './Home'
import Book from './Book'

render(() => (
  <Router root={props => (
    <>
      <header>
        <a href="/">
          <h1>blinkist-downloader</h1>
        </a>
        <hr />
      </header>
      {props.children}
      <footer>
        <hr />
        <a href="https://github.com/vogler/blinkist-downloader">See GitHub for help</a>
      </footer>
    </>
  )}
  >
    <Route path="/" component={Home} />
    <Route path="/book/:id" component={Book} />
  </Router>
), document.getElementById('root')!)
