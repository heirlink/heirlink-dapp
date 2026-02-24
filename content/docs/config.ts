export const docsNav = [
  { slug: "", title: "Обзор" },
  { slug: "inheritance", title: "Распределение наследства" },
  { slug: "secret", title: "Секретное разделение" },
] as const;

export type DocSlug = (typeof docsNav)[number]["slug"];
