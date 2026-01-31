export type ComponentType = "text" | "button" | "image" | "gallery" | "spacer";

export type BuilderComponent = {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
};

export type BuilderColumn = {
  id: string;
  span: number; // 1-12
  components: BuilderComponent[];
};

export type BuilderRow = {
  id: string;
  columns: BuilderColumn[];
};

export type BuilderSection = {
  id: string;
  rows: BuilderRow[];
};

export type PageSchema = {
  title?: string;
  sections: BuilderSection[];
};

export type BuilderState = {
  past: PageSchema[];
  present: PageSchema;
  future: PageSchema[];
};

export type SelectionState = {
  selectedId: string | null;
  selectedType: "section" | "row" | "column" | "component" | null;
  collapsedSectionIds: string[];
};
