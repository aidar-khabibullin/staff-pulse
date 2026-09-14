import { useCallback, useMemo, useRef, useState } from "react";
import { OrgTree } from "@/features/org-tree/ui/OrgTree";
import { OrgTable } from "@/features/org-table/ui/OrgTable";
import { buildOrgTree } from "@/features/org-tree/model/buildOrgTree";
import { AiSearchBar } from "@/features/ai-search/ui/AiSearchBar";
import { parseNaturalLanguageQuery } from "@/features/ai-search/model/parseNaturalLanguageQuery";
import { computeMatchedIds } from "@/features/ai-search/model/applyStructuredFilter";
import { useOrgTree } from "@/shared/lib/useOrgTree";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import {
  useOrgTreeLiveUpdates,
  type ConnectionStatus,
  type OrgNodePatchMessage,
} from "@/shared/lib/useOrgTreeLiveUpdates";
import type { PatchEvent } from "@/features/org-table/model/useIncrementalAggregates";
import {
  AppRoot,
  ConnectionDot,
  ConnectionStatus as ConnectionStatusBadge,
  Footer,
  Header,
  Layout,
  Spinner,
  Status,
  StatusText,
  Subtitle,
  TablePanel,
  Title,
  TreePanel,
  ViewToggle,
  ViewToggleButton,
} from "./App.styles";

const SEARCH_DEBOUNCE_MS = 250;
const CURRENT_YEAR = new Date().getFullYear();

type View = "tree" | "table";

const CONNECTION_STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: "Подключение…",
  open: "Live-обновления активны",
  reconnecting: "Переподключение…",
  closed: "Соединение закрыто",
};

export function App() {
  const { status, data, error, applyPatch } = useOrgTree();
  const [view, setView] = useState<View>("tree");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastPatch, setLastPatch] = useState<PatchEvent | null>(null);
  const patchSeqRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const parsedQuery = useMemo(
    () => parseNaturalLanguageQuery(debouncedSearchQuery),
    [debouncedSearchQuery],
  );
  const matchedIds = useMemo(() => {
    if (!data) {
      return null;
    }
    const tree = buildOrgTree(data);
    return computeMatchedIds(tree, parsedQuery.filter);
  }, [data, parsedQuery]);

  const handlePatch = useCallback(
    (patch: OrgNodePatchMessage) => {
      applyPatch(patch);
      patchSeqRef.current += 1;
      setLastPatch({ nodeId: patch.id, seq: patchSeqRef.current });
    },
    [applyPatch],
  );

  const connectionStatus = useOrgTreeLiveUpdates(handlePatch);

  return (
    <AppRoot>
      <Header>
        <Title>Орг-структура компании</Title>
        <Subtitle>Дивизионы → Отделы → Команды</Subtitle>

        <AiSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          usedFallback={parsedQuery.usedFallback}
          isActive={debouncedSearchQuery.trim() !== ""}
        />

        <ConnectionStatusBadge
          data-testid="connection-status"
          data-status={connectionStatus}
        >
          <ConnectionDot aria-hidden="true" />
          {CONNECTION_STATUS_LABEL[connectionStatus]}
        </ConnectionStatusBadge>

        <ViewToggle
          data-testid="view-toggle"
          role="group"
          aria-label="Режим отображения"
        >
          <ViewToggleButton
            type="button"
            data-testid="view-toggle-tree"
            aria-pressed={view === "tree"}
            onClick={() => setView("tree")}
          >
            Дерево
          </ViewToggleButton>
          <ViewToggleButton
            type="button"
            data-testid="view-toggle-table"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            Таблица
          </ViewToggleButton>
        </ViewToggle>
      </Header>

      {(status === "loading" || status === "revalidating") && data === null && (
        <Status data-testid="org-tree-loading">
          <Spinner aria-hidden="true" />
          <StatusText>Загрузка орг-структуры…</StatusText>
        </Status>
      )}

      {status === "error" && (
        <Status data-testid="org-tree-error">
          <StatusText $error>
            Не удалось загрузить данные:{" "}
            {error?.message ?? "неизвестная ошибка"}
          </StatusText>
        </Status>
      )}

      {status === "empty" && (
        <Status data-testid="org-tree-empty">
          <StatusText>Орг-структура пуста</StatusText>
        </Status>
      )}

      {data !== null && data.length > 0 && (
        <Layout data-view={view}>
          <TreePanel>
            <OrgTree
              nodes={data}
              selectedId={selectedId}
              matchedIds={matchedIds}
              activeView={view}
            />
          </TreePanel>
          <TablePanel>
            <OrgTable
              nodes={data}
              selectedId={selectedId}
              onSelect={setSelectedId}
              lastPatch={lastPatch}
              filter={parsedQuery.filter}
            />
          </TablePanel>
        </Layout>
      )}

      <Footer>© {CURRENT_YEAR} Орг-структура компании</Footer>
    </AppRoot>
  );
}
