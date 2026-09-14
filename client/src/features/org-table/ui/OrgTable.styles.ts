import styled, { keyframes } from 'styled-components'

export const Container = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

export const FilterInput = styled.input`
  flex: none;
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9rem;
  transition: border-color ${({ theme }) => theme.motion.fast};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const TableScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

export const HeaderCell = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  padding: 0.6rem 0.75rem;
  background: ${({ theme }) => theme.colors.headerBackground};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background-color ${({ theme }) => theme.motion.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.accentSelected};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const SortIndicator = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.7rem;
`

export const Row = styled.tr<{ 'data-selected': boolean }>`
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.fast};

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

  @media (prefers-reduced-motion: reduce) {
    transition: none;
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
