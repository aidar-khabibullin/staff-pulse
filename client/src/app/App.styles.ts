import styled, { keyframes } from 'styled-components'
import type { ConnectionStatus as ConnectionStatusValue } from '@/shared/lib/useOrgTreeLiveUpdates'

export const AppRoot = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  font-family: ${({ theme }) => theme.font.family};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
`

export const Header = styled.header`
  flex: none;
  margin-bottom: 1.5rem;
`

export const Footer = styled.footer`
  flex: none;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8rem;
  text-align: center;
`

export const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`

export const Subtitle = styled.p`
  margin: 0.5rem 0 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
`

const pulse = keyframes`
  50% {
    opacity: 0.3;
  }
`

export const ConnectionStatus = styled.div<{ 'data-status': ConnectionStatusValue }>`
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const ConnectionDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.neutralDot};

  ${ConnectionStatus}[data-status='open'] & {
    background: ${({ theme }) => theme.colors.success};
  }

  ${ConnectionStatus}[data-status='connecting'] &,
  ${ConnectionStatus}[data-status='reconnecting'] & {
    background: ${({ theme }) => theme.colors.warning};
    animation: ${pulse} 1s ease-in-out infinite;
  }

  ${ConnectionStatus}[data-status='closed'] & {
    background: ${({ theme }) => theme.colors.danger};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const ViewToggle = styled.div`
  display: flex;
  width: fit-content;
  gap: 0.25rem;
  margin-top: 1rem;
  padding: 0.25rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};

  @media (min-width: 1280px) {
    display: none;
  }
`

export const ViewToggleButton = styled.button`
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.fast},
    color ${({ theme }) => theme.motion.fast};

  &[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const Layout = styled.div<{ 'data-view': 'tree' | 'table' }>`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: 1.5rem;

  @media (min-width: 1280px) {
    grid-template-columns: 1fr 1fr;
  }
`

export const PanelTitle = styled.h2`
  display: none;
  flex: none;
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textDark};

  @media (min-width: 1280px) {
    display: block;
  }
`

export const PerformanceLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const PerformanceLegendItem = styled.span<{ $level: 'high' | 'medium' | 'low' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  &::before {
    content: '';
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: ${({ theme, $level }) =>
      $level === 'high'
        ? theme.colors.success
        : $level === 'medium'
          ? theme.colors.warning
          : theme.colors.danger};
  }
`

export const TreePanel = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 1279.98px) {
    ${Layout}[data-view='table'] & {
      display: none;
    }
  }
`

export const TablePanel = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 1279.98px) {
    ${Layout}[data-view='tree'] & {
      display: none;
    }
  }
`

export const Status = styled.div`
  flex: 1;
  min-height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const StatusText = styled.span<{ $error?: boolean }>`
  font-size: 1rem;
  color: ${({ theme, $error }) => ($error ? theme.colors.dangerText : theme.colors.textMuted)};
`

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled.span`
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.75rem;
  border: 3px solid ${({ theme }) => theme.colors.borderLight};
  border-top-color: ${({ theme }) => theme.colors.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`
