import type { OrgNode } from "../types.js";

const DIVISION_NAMES = [
  "Дивизион продаж",
  "Дивизион разработки",
  "Дивизион маркетинга",
  "Дивизион операций",
  "Дивизион финансов",
];

const DEPARTMENT_NAMES = [
  "Отдел клиентского сервиса",
  "Отдел аналитики",
  "Отдел разработки продукта",
  "Отдел контроля качества",
  "Отдел закупок",
  "Отдел кадров",
  "Отдел логистики",
  "Отдел бухгалтерии",
];

const TEAM_NAMES = [
  "Команда фронтенда",
  "Команда бэкенда",
  "Команда инфраструктуры",
  "Команда дизайна",
  "Команда поддержки",
  "Команда исследований",
  "Команда продаж B2B",
  "Команда продаж B2C",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickName(pool: string[], index: number): string {
  const base = pool[index % pool.length];
  const cycle = Math.floor(index / pool.length);
  return cycle === 0 ? base : `${base} ${cycle + 1}`;
}

function randomUpdatedAt(): string {
  const now = Date.now();
  const daysAgo = randomInt(0, 30);
  return new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

interface GenerateOptions {
  divisionsCount?: number;
  departmentsPerDivision?: [number, number];
  teamsPerDepartment?: [number, number];
}

export function generateOrgTree(options: GenerateOptions = {}): OrgNode[] {
  const {
    divisionsCount = 5,
    departmentsPerDivision = [3, 4],
    teamsPerDepartment = [2, 4],
  } = options;

  const nodes: OrgNode[] = [];
  let nextId = 1;

  const makeNode = (parentId: string | null, name: string): OrgNode => {
    const id = String(nextId++);
    return {
      id,
      name,
      parentId,
      headcount: randomInt(2, 40),
      budget: randomInt(500_000, 20_000_000),
      performance: randomInt(0, 100),
      updatedAt: randomUpdatedAt(),
    };
  };

  for (let d = 0; d < divisionsCount; d++) {
    const division = makeNode(null, pickName(DIVISION_NAMES, d));
    nodes.push(division);

    const departmentsCount = randomInt(
      departmentsPerDivision[0],
      departmentsPerDivision[1],
    );

    for (let dep = 0; dep < departmentsCount; dep++) {
      const department = makeNode(
        division.id,
        pickName(DEPARTMENT_NAMES, dep),
      );
      nodes.push(department);

      const teamsCount = randomInt(
        teamsPerDepartment[0],
        teamsPerDepartment[1],
      );

      for (let t = 0; t < teamsCount; t++) {
        nodes.push(makeNode(department.id, pickName(TEAM_NAMES, t)));
      }
    }
  }

  return nodes;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  errors: string[];
}

export function checkOrgTreeIntegrity(nodes: OrgNode[]): IntegrityCheckResult {
  const errors: string[] = [];
  const ids = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    if (node.parentId !== null && !ids.has(node.parentId)) {
      errors.push(
        `Узел ${node.id} ссылается на несуществующего родителя ${node.parentId}`,
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}
