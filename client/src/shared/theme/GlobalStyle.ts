import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light dark;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }
`
