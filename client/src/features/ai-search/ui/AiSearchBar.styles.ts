import styled from 'styled-components'

export const Container = styled.div`
  display: grid;
  gap: 0.35rem;
`

export const Input = styled.input`
  padding: 0.55rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.95rem;
  min-width: 18rem;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 1px;
  }
`

export const Mode = styled.span<{ 'data-mode': 'idle' | 'ai' | 'fallback' }>`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};

  &[data-mode='ai'] {
    color: ${({ theme }) => theme.colors.successText};
  }

  &[data-mode='fallback'] {
    color: ${({ theme }) => theme.colors.fallback};
  }
`
