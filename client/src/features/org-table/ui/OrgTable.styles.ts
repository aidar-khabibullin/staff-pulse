import styled, { keyframes } from 'styled-components'

export const Container = styled.div`
  display: grid;
  gap: 0.75rem;
`

export const FilterInput = styled.input`
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9rem;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 1px;
  }
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`

export const HeaderCell = styled.th`
  text-align: left;
  padding: 0.6rem 0.75rem;
  background: ${({ theme }) => theme.colors.headerBackground};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.accentSelected};
  }
`

export const SortIndicator = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.7rem;
`

export const Row = styled.tr<{ 'data-selected': boolean }>`
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  &[data-selected='true'] {
    background: ${({ theme }) => theme.colors.accentSelected};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`

// keyframes не имеют доступа к theme через интерполяцию пропсов, поэтому цвет
// продублирован здесь и должен совпадать с theme.colors.highlight вручную.
const cellHighlight = keyframes`
  from {
    background-color: #fff3bf;
  }
  to {
    background-color: transparent;
  }
`

export const Cell = styled.td<{ 'data-updated'?: boolean }>`
  padding: 0.55rem 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};

  &[data-updated='true'] {
    animation: ${cellHighlight} 1.5s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-updated='true'] {
      animation: none;
      background-color: ${({ theme }) => theme.colors.highlight};
    }
  }
`

export const EmptyCell = styled.td`
  padding: 1.5rem 0.75rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`
