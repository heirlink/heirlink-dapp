export const docsNav = [
  { slug: "", title: "Обзор" },
  { slug: "inheritance", title: "Распределение наследства" },
  { slug: "manage", title: "Управление наследством" },
  { slug: "claim", title: "Получить наследство" },
  { slug: "secret", title: "Секретное разделение" },
] as const;

export type DocSlug = (typeof docsNav)[number]["slug"];
