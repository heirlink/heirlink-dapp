export const docsNav = [
  { slug: "", title: "Обзор" },
  { slug: "inheritance", title: "Распределение наследства" },
  { slug: "manage", title: "Управление наследством" },
  { slug: "claim", title: "Получить наследство" },
  { slug: "secret", title: "Тесты" },
] as const;

export type DocSlug = (typeof docsNav)[number]["slug"];
