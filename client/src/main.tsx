import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import { App } from '@/app/App'
import { GlobalStyle } from '@/shared/theme/GlobalStyle'
import { theme } from '@/shared/theme/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
