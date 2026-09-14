import styled, { css, keyframes } from "styled-components";

const listReset = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
`;

export const TreeScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
`;

export const Tree = styled.ul`
  ${listReset}// Запас снизу, чтобы scrollIntoView({ block: 'start' }) мог прижать к верху
  // даже узел ближе к концу раскрытой части дерева — без запаса браузеру
  // физически некуда прокручивать (scrollTop ограничен scrollHeight - clientHeight).
`;

// Экспортируется, чтобы OrgTree.tsx мог отложить scrollIntoView до окончания
// этой анимации — иначе позиция для скролла считается по ещё не доросшему
// max-height, и выбранный узел не дожимается до верхнего края области.
export const EXPAND_ANIMATION_MS = 200;

const expandIn = keyframes`
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 2000px;
    opacity: 1;
  }
`;

export const Children = styled.ul`
  ${listReset}
  margin-top: 0.4rem;
  margin-left: 1.5rem;
  padding-left: 0.75rem;
  border-left: 1px dashed ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  animation: ${expandIn} ${EXPAND_ANIMATION_MS}ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Node = styled.li`
  display: grid;
`;

export const NodeRow = styled.div<{ "data-selected": boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition:
    background-color ${({ theme }) => theme.motion.fast},
    border-color ${({ theme }) => theme.motion.fast};

  &[data-selected="true"] {
    background: ${({ theme }) => theme.colors.accentSelected};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Toggle = styled.button`
  width: 1.5rem;
  height: 1.5rem;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background-color ${({ theme }) => theme.motion.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ToggleIcon = styled.span`
  display: inline-flex;
  transform: rotate(0deg);
  transition: transform ${({ theme }) => theme.motion.fast};

  ${Toggle}[aria-expanded='true'] & {
    transform: rotate(90deg);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ToggleSpacer = styled.span`
  width: 1.5rem;
  flex: none;
`;

export const PerformanceDot = styled.span<{
  "data-performance": "high" | "medium" | "low";
}>`
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;

  &[data-performance="high"] {
    background: ${({ theme }) => theme.colors.success};
  }

  &[data-performance="medium"] {
    background: ${({ theme }) => theme.colors.warning};
  }

  &[data-performance="low"] {
    background: ${({ theme }) => theme.colors.danger};
  }
`;

export const NodeName = styled.span`
  font-weight: 600;
  flex: 1 1 auto;
`;

export const NodeMeta = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
  white-space: nowrap;
`;

export const Empty = styled.div`
  padding: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  border: 1px dashed ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;
