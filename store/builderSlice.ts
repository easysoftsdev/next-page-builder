import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BuilderColumn, BuilderState, PageSchema } from "../types/builder";
import { createColumn, createComponent, createEmptyPage, createRow, createSection } from "../lib/schema";
import { makeId } from "../lib/id";

const clonePage = (page: PageSchema): PageSchema =>
  JSON.parse(JSON.stringify(page)) as PageSchema;

const initialState: BuilderState = {
  past: [],
  present: createEmptyPage(),
  future: [],
};

const builderSlice = createSlice({
  name: "builder",
  initialState,
  reducers: {
    updatePageMeta(state, action: PayloadAction<{ title?: string }>) {
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      state.present.title = action.payload.title;
    },
    setPage(state, action: PayloadAction<PageSchema>) {
      state.present = action.payload;
      state.past = [];
      state.future = [];
    },
    undo(state) {
      const previous = state.past.pop();
      if (!previous) return;
      state.future.unshift(clonePage(state.present));
      state.present = previous;
    },
    redo(state) {
      const next = state.future.shift();
      if (!next) return;
      state.past.push(clonePage(state.present));
      state.present = next;
    },
    addSection(state) {
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      state.present.sections.push(createSection());
    },
    moveSection(
      state,
      action: PayloadAction<{ sectionId: string; toIndex: number; duplicate?: boolean }>
    ) {
      const { sectionId, toIndex, duplicate } = action.payload;
      const fromIndex = state.present.sections.findIndex((item) => item.id === sectionId);
      if (fromIndex < 0) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      let insertAt = Math.min(Math.max(toIndex, 0), state.present.sections.length);
      if (duplicate) {
        const cloned = cloneSection(state.present.sections[fromIndex]);
        state.present.sections.splice(insertAt, 0, cloned);
        return;
      }
      const [moved] = state.present.sections.splice(fromIndex, 1);
      if (fromIndex < insertAt) {
        insertAt = Math.max(0, insertAt - 1);
      }
      state.present.sections.splice(insertAt, 0, moved);
    },
    addRow(state, action: PayloadAction<{ sectionId: string }>) {
      const section = findSection(state.present, action.payload.sectionId);
      if (!section) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      section.rows.push(createRow());
    },
    moveRow(
      state,
      action: PayloadAction<{
        rowId: string;
        fromSectionId: string;
        toSectionId: string;
        toIndex: number;
        duplicate?: boolean;
      }>
    ) {
      const { rowId, fromSectionId, toSectionId, toIndex, duplicate } = action.payload;
      const fromSection = findSection(state.present, fromSectionId);
      const toSection = findSection(state.present, toSectionId);
      if (!fromSection || !toSection) return;
      const fromIndex = fromSection.rows.findIndex((item) => item.id === rowId);
      if (fromIndex < 0) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      let insertAt = Math.min(Math.max(toIndex, 0), toSection.rows.length);
      if (duplicate) {
        const cloned = cloneRow(fromSection.rows[fromIndex]);
        toSection.rows.splice(insertAt, 0, cloned);
        return;
      }
      const [moved] = fromSection.rows.splice(fromIndex, 1);
      if (fromSectionId === toSectionId && fromIndex < insertAt) {
        insertAt = Math.max(0, insertAt - 1);
      }
      toSection.rows.splice(insertAt, 0, moved);
      if (fromSection.rows.length === 0) {
        fromSection.rows.push(createRow());
      }
    },
    addColumn(state, action: PayloadAction<{ rowId: string; span?: number }>) {
      const row = findRow(state.present, action.payload.rowId);
      if (!row) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      row.columns.push(createColumn(action.payload.span ?? 6));
    },
    addComponent(
      state,
      action: PayloadAction<{
        columnId: string;
        type: "text" | "button" | "image" | "gallery" | "spacer";
        index?: number;
      }>
    ) {
      const column = findColumn(state.present, action.payload.columnId);
      if (!column) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      const created = createComponent(action.payload.type);
      if (typeof action.payload.index === "number" && action.payload.index >= 0) {
        const insertAt = Math.min(action.payload.index, column.components.length);
        column.components.splice(insertAt, 0, created);
      } else {
        column.components.push(created);
      }
    },
    moveComponent(
      state,
      action: PayloadAction<{
        componentId: string;
        fromColumnId: string;
        toColumnId: string;
        toIndex?: number;
        duplicate?: boolean;
      }>
    ) {
      const { componentId, fromColumnId, toColumnId, toIndex, duplicate } = action.payload;
      const fromColumn = findColumn(state.present, fromColumnId);
      const toColumn = findColumn(state.present, toColumnId);
      if (!fromColumn || !toColumn) return;
      const fromIndex = fromColumn.components.findIndex((item) => item.id === componentId);
      if (fromIndex < 0) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      let insertAt =
        typeof toIndex === "number" && toIndex >= 0
          ? Math.min(toIndex, toColumn.components.length)
          : toColumn.components.length;
      if (duplicate) {
        const cloned = cloneComponent(fromColumn.components[fromIndex]);
        toColumn.components.splice(insertAt, 0, cloned);
        return;
      }
      const [moved] = fromColumn.components.splice(fromIndex, 1);
      if (fromColumnId === toColumnId && typeof toIndex === "number" && fromIndex < insertAt) {
        insertAt = Math.max(0, insertAt - 1);
      }
      toColumn.components.splice(insertAt, 0, moved);
    },
    moveColumn(
      state,
      action: PayloadAction<{
        columnId: string;
        fromRowId: string;
        toRowId: string;
        toIndex?: number;
        duplicate?: boolean;
      }>
    ) {
      const { columnId, fromRowId, toRowId, toIndex, duplicate } = action.payload;
      const fromRow = findRow(state.present, fromRowId);
      const toRow = findRow(state.present, toRowId);
      if (!fromRow || !toRow) return;
      const fromIndex = fromRow.columns.findIndex((item) => item.id === columnId);
      if (fromIndex < 0) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      let insertAt =
        typeof toIndex === "number" && toIndex >= 0
          ? Math.min(toIndex, toRow.columns.length)
          : toRow.columns.length;
      if (duplicate) {
        const cloned = cloneColumn(fromRow.columns[fromIndex]);
        toRow.columns.splice(insertAt, 0, cloned);
        return;
      }
      const [moved] = fromRow.columns.splice(fromIndex, 1);
      if (fromRowId === toRowId && typeof toIndex === "number" && fromIndex < insertAt) {
        insertAt = Math.max(0, insertAt - 1);
      }
      toRow.columns.splice(insertAt, 0, moved);
      if (fromRowId !== toRowId && fromRow.columns.length === 0) {
        fromRow.columns.push(createColumn(12));
      }
    },
    updateComponentProps(
      state,
      action: PayloadAction<{ componentId: string; patch: Record<string, unknown> }>
    ) {
      const component = findComponent(state.present, action.payload.componentId);
      if (!component) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      component.props = { ...component.props, ...action.payload.patch };
    },
    updateColumnSpan(state, action: PayloadAction<{ columnId: string; span: number }>) {
      const column = findColumn(state.present, action.payload.columnId);
      if (!column) return;
      const snapshot = clonePage(state.present);
      state.past.push(snapshot);
      state.future = [];
      column.span = Math.min(12, Math.max(1, action.payload.span));
    },
    deleteComponent(state, action: PayloadAction<{ componentId: string }>) {
      const snapshot = clonePage(state.present);
      let mutated = false;
      for (const section of state.present.sections) {
        for (const row of section.rows) {
          for (const column of row.columns) {
            const index = column.components.findIndex((item) => item.id === action.payload.componentId);
            if (index >= 0) {
              column.components.splice(index, 1);
              mutated = true;
              break;
            }
          }
        }
      }
      if (mutated) {
        state.past.push(snapshot);
        state.future = [];
      }
    },
    deleteColumn(state, action: PayloadAction<{ columnId: string }>) {
      const snapshot = clonePage(state.present);
      let mutated = false;
      for (const section of state.present.sections) {
        for (const row of section.rows) {
          const index = row.columns.findIndex((item) => item.id === action.payload.columnId);
          if (index >= 0) {
            row.columns.splice(index, 1);
            if (row.columns.length === 0) {
              row.columns.push(createColumn(12));
            }
            mutated = true;
            break;
          }
        }
      }
      if (mutated) {
        state.past.push(snapshot);
        state.future = [];
      }
    },
    deleteRow(state, action: PayloadAction<{ rowId: string }>) {
      const snapshot = clonePage(state.present);
      let mutated = false;
      for (const section of state.present.sections) {
        const index = section.rows.findIndex((item) => item.id === action.payload.rowId);
        if (index >= 0) {
          section.rows.splice(index, 1);
          if (section.rows.length === 0) {
            section.rows.push(createRow());
          }
          mutated = true;
          break;
        }
      }
      if (mutated) {
        state.past.push(snapshot);
        state.future = [];
      }
    },
    deleteSection(state, action: PayloadAction<{ sectionId: string }>) {
      const snapshot = clonePage(state.present);
      const index = state.present.sections.findIndex((item) => item.id === action.payload.sectionId);
      if (index < 0) return;
      state.present.sections.splice(index, 1);
      if (state.present.sections.length === 0) {
        state.present.sections.push(createSection());
      }
      state.past.push(snapshot);
      state.future = [];
    },
  },
});

function findSection(page: PageSchema, sectionId: string) {
  return page.sections.find((section) => section.id === sectionId);
}

function findRow(page: PageSchema, rowId: string) {
  for (const section of page.sections) {
    const row = section.rows.find((item) => item.id === rowId);
    if (row) return row;
  }
  return null;
}

function findColumn(page: PageSchema, columnId: string): BuilderColumn | null {
  for (const section of page.sections) {
    for (const row of section.rows) {
      const column = row.columns.find((item) => item.id === columnId);
      if (column) return column;
    }
  }
  return null;
}

function findComponent(page: PageSchema, componentId: string) {
  for (const section of page.sections) {
    for (const row of section.rows) {
      for (const column of row.columns) {
        const component = column.components.find((item) => item.id === componentId);
        if (component) return component;
      }
    }
  }
  return null;
}

function cloneComponent(component: { id: string; type: "text" | "button" | "image" | "gallery" | "spacer"; props: Record<string, unknown> }) {
  return {
    ...component,
    id: makeId("cmp"),
    props: JSON.parse(JSON.stringify(component.props)) as Record<string, unknown>,
  };
}

function cloneColumn(column: BuilderColumn): BuilderColumn {
  return {
    id: makeId("col"),
    span: column.span,
    components: column.components.map((component) => cloneComponent(component)),
  };
}

function cloneRow(row: { id: string; columns: BuilderColumn[] }) {
  return {
    id: makeId("row"),
    columns: row.columns.map((column) => cloneColumn(column)),
  };
}

function cloneSection(section: { id: string; rows: { id: string; columns: BuilderColumn[] }[] }) {
  return {
    id: makeId("section"),
    rows: section.rows.map((row) => cloneRow(row)),
  };
}

export const {
  updatePageMeta,
  setPage,
  undo,
  redo,
  addSection,
  moveSection,
  addRow,
  moveRow,
  addColumn,
  addComponent,
  moveComponent,
  moveColumn,
  updateComponentProps,
  updateColumnSpan,
  deleteComponent,
  deleteColumn,
  deleteRow,
  deleteSection,
} = builderSlice.actions;

export default builderSlice.reducer;
