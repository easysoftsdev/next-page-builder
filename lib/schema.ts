import { makeId } from "./id";
import type {
  BuilderColumn,
  BuilderComponent,
  BuilderRow,
  BuilderSection,
  ComponentType,
  PageSchema,
} from "../types/builder";

export function createComponent(type: ComponentType): BuilderComponent {
  const base: BuilderComponent = { id: makeId("cmp"), type, props: {} };

  switch (type) {
    case "text":
      return { ...base, props: { text: "New text" } };
    case "button":
      return { ...base, props: { label: "Click me", href: "#" } };
    case "image":
      return {
        ...base,
        props: {
          src: "https://images.unsplash.com/flagged/photo-1564468781192-f023d514222d?auto=format&fit=crop&w=1200&q=80",
          alt: "Placeholder image",
        },
      };
    case "gallery":
      return { ...base, props: { items: [], columns: 3, gap: 12 } };
    case "spacer":
      return { ...base, props: { height: 24 } };
    default:
      return base;
  }
}

export function createColumn(span = 6): BuilderColumn {
  return { id: makeId("col"), span, components: [] };
}

export function createRow(): BuilderRow {
  return { id: makeId("row"), columns: [createColumn(6), createColumn(6)] };
}

export function createSection(): BuilderSection {
  return { id: makeId("section"), rows: [createRow()] };
}

export function createEmptyPage(): PageSchema {
  return {
    title: "Untitled Page",
    sections: [
      {
        id: "section-1",
        rows: [
          {
            id: "row-1",
            columns: [
              { id: "col-1", span: 6, components: [] },
              { id: "col-2", span: 6, components: [] },
            ],
          },
        ],
      },
    ],
  };
}
