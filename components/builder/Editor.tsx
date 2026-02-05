"use client";

import type { CollisionDetection, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { BuilderComponent, PageSchema } from "../../types/builder";
import { useLanguage } from '../../lib/language-context';
import {
  addColumn,
  addComponent,
  addRow,
  addSection,
  deleteColumn,
  deleteComponent,
  deleteRow,
  deleteSection,
  moveColumn,
  moveComponent,
  moveRow,
  moveSection,
  redo,
  setPage,
  undo,
  updatePageMeta,
  updateColumnSpan,
  updateComponentProps,
} from "../../store/builderSlice";
import { clearSelection, selectNode, toggleSectionCollapse } from "../../store/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { ComponentRenderer } from "../renderer/components";
import { MediaLibraryModal, type MediaItem } from "./MediaLibraryModal";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Image,
  Images,
  Plus,
  Square,
  Trash2,
  Type,
} from "lucide-react";

const COMPONENT_TYPES: BuilderComponent["type"][] = ["text", "button", "image", "gallery", "spacer"];

const getComponentIcon = (type: BuilderComponent['type']) => {
  const icons: Record<BuilderComponent['type'], React.ReactNode> = {
    text: <Type size={16} />,
    button: <Square size={16} />,
    image: <Image size={16} />,
    gallery: <Images size={16} />,
    spacer: <ArrowDownUp size={16} />,
  };
  return icons[type];
};

type DragKind =
  | "section"
  | "row"
  | "column"
  | "component"
  | "palette"
  | "row-end"
  | "section-end"
  | "column-end"
  | "page-end"
  | "section-drop";

type DragMeta = {
  type: DragKind;
  sectionId?: string;
  rowId?: string;
  columnId?: string;
  componentId?: string;
  componentType?: BuilderComponent["type"];
  index?: number;
};

const sortableId = (type: DragKind, id: string) => `${type}:${id}`;

export function Editor({ slug }: { slug: string }) {
  const dispatch = useAppDispatch();
  const { currentLanguage, setCurrentLanguage, languages } = useLanguage();
  const page = useAppSelector((state) => state.builder.present);
  const past = useAppSelector((state) => state.builder.past);
  const future = useAppSelector((state) => state.builder.future);
  const history = useMemo(() => ({ past, future }), [past, future]);
  const selection = useAppSelector((state) => state.ui);
  const [status, setStatus] = useState<string>("Idle");
  const [activeDrag, setActiveDrag] = useState<{ type: DragKind; label: string } | null>(null);
  const duplicateOnDrop = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length) return pointerCollisions;
    return closestCenter(args);
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('Loading...');
      const response = await fetch(
        `/api/page?slug=${encodeURIComponent(slug)}&lang=${encodeURIComponent(currentLanguage)}`,
      );
      const data = (await response.json()) as { page: PageSchema };
      if (!ignore) {
        dispatch(setPage(data.page));
        dispatch(clearSelection());
        setStatus('Loaded');
      }
    }
    load().catch(() => setStatus('Failed to load'));
    return () => {
      ignore = true;
    };
  }, [dispatch, slug, currentLanguage]);

  async function save() {
    setStatus("Saving...");
    const response = await fetch(
      `/api/page?slug=${encodeURIComponent(slug)}&lang=${encodeURIComponent(currentLanguage)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      },
    );
    if (response.ok) {
      setStatus("Saved");
    } else {
      setStatus("Save failed");
    }
  }

  function getSectionIndex(sectionId: string) {
    return page.sections.findIndex((section) => section.id === sectionId);
  }

  function findSection(sectionId: string) {
    return page.sections.find((section) => section.id === sectionId) ?? null;
  }

  function findRow(rowId: string) {
    for (const section of page.sections) {
      const row = section.rows.find((item) => item.id === rowId);
      if (row) return { row, sectionId: section.id };
    }
    return null;
  }

  function findColumn(columnId: string) {
    for (const section of page.sections) {
      for (const row of section.rows) {
        const column = row.columns.find((item) => item.id === columnId);
        if (column) return { column, rowId: row.id };
      }
    }
    return null;
  }

  function getRowIndex(sectionId: string, rowId: string) {
    const section = findSection(sectionId);
    if (!section) return -1;
    return section.rows.findIndex((row) => row.id === rowId);
  }

  function getColumnIndex(rowId: string, columnId: string) {
    const row = findRow(rowId)?.row;
    if (!row) return -1;
    return row.columns.findIndex((column) => column.id === columnId);
  }

  function getComponentIndex(columnId: string, componentId: string) {
    const column = findColumn(columnId)?.column;
    if (!column) return -1;
    return column.components.findIndex((component) => component.id === componentId);
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragMeta | undefined;
    if (!data) return;
    const activatorEvent = event.activatorEvent as MouseEvent | PointerEvent | KeyboardEvent | undefined;
    duplicateOnDrop.current = Boolean(activatorEvent && "altKey" in activatorEvent && activatorEvent.altKey);
    switch (data.type) {
      case "section":
        setActiveDrag({ type: "section", label: "Section" });
        break;
      case "row":
        setActiveDrag({ type: "row", label: "Row" });
        break;
      case "column":
        setActiveDrag({ type: "column", label: "Column" });
        break;
      case "component":
        setActiveDrag({ type: "component", label: "Component" });
        break;
      case "palette":
        setActiveDrag({ type: "palette", label: `New ${data.componentType}` });
        break;
      default:
        setActiveDrag(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const duplicate = duplicateOnDrop.current;
    duplicateOnDrop.current = false;
    setActiveDrag(null);
    if (!over) return;
    const activeData = active.data.current as DragMeta | undefined;
    const overData = over.data.current as DragMeta | undefined;
    if (!activeData || !overData) return;

    if (activeData.type === "section") {
      if (overData.type === "section-drop") {
        dispatch(
          moveSection({
            sectionId: activeData.sectionId ?? "",
            toIndex: overData.index ?? 0,
            duplicate,
          })
        );
        return;
      }
      if (overData.type === "page-end") {
        dispatch(moveSection({ sectionId: activeData.sectionId ?? "", toIndex: page.sections.length, duplicate }));
        return;
      }
      let targetSectionId = overData.sectionId ?? "";
      if (!targetSectionId && overData.rowId) {
        targetSectionId = findRow(overData.rowId)?.sectionId ?? "";
      }
      if (!targetSectionId && overData.columnId) {
        const rowId = findColumn(overData.columnId)?.rowId;
        if (rowId) {
          targetSectionId = findRow(rowId)?.sectionId ?? "";
        }
      }
      let toIndex = targetSectionId ? getSectionIndex(targetSectionId) : -1;
      if (toIndex >= 0 && activeData.sectionId) {
        const fromIndex = getSectionIndex(activeData.sectionId);
        if (fromIndex >= 0 && toIndex >= 0 && fromIndex < toIndex) {
          toIndex += 1;
        }
      }
      if (toIndex >= 0 && activeData.sectionId) {
        dispatch(moveSection({ sectionId: activeData.sectionId, toIndex, duplicate }));
      }
      return;
    }

    if (activeData.type === "row") {
      const fromSectionId = activeData.sectionId;
      if (!fromSectionId || !activeData.rowId) return;
      let toSectionId = "";
      let toIndex = -1;
      if (overData.type === "row") {
        toSectionId = overData.sectionId ?? "";
        if (toSectionId) {
          toIndex = getRowIndex(toSectionId, overData.rowId ?? "");
        }
      } else if (overData.type === "section-end") {
        toSectionId = overData.sectionId ?? "";
        const section = toSectionId ? findSection(toSectionId) : null;
        toIndex = section ? section.rows.length : -1;
      }
      if (toIndex >= 0 && toSectionId && activeData.rowId) {
        const fromIndex = getRowIndex(fromSectionId, activeData.rowId);
        if (fromSectionId === toSectionId && fromIndex >= 0 && fromIndex < toIndex) {
          toIndex += 1;
        }
      }
      if (toSectionId && toIndex >= 0) {
        dispatch(
          moveRow({
            rowId: activeData.rowId,
            fromSectionId,
            toSectionId,
            toIndex,
            duplicate,
          })
        );
      }
      return;
    }

    if (activeData.type === "column") {
      const fromRowId = activeData.rowId;
      if (!fromRowId || !activeData.columnId) return;
      let toRowId = "";
      let toIndex = -1;
      if (overData.type === "column") {
        toRowId = overData.rowId ?? "";
        if (toRowId) {
          toIndex = getColumnIndex(toRowId, overData.columnId ?? "");
        }
      } else if (overData.type === "row-end") {
        toRowId = overData.rowId ?? "";
        const row = toRowId ? findRow(toRowId)?.row : null;
        toIndex = row ? row.columns.length : -1;
      }
      if (toRowId && toIndex >= 0) {
        dispatch(
          moveColumn({
            columnId: activeData.columnId,
            fromRowId,
            toRowId,
            toIndex,
            duplicate,
          })
        );
      }
      return;
    }

    if (activeData.type === "component") {
      const fromColumnId = activeData.columnId;
      if (!fromColumnId || !activeData.componentId) return;
      let toColumnId = "";
      let toIndex = -1;
      if (overData.type === "component") {
        toColumnId = overData.columnId ?? "";
        if (toColumnId) {
          toIndex = getComponentIndex(toColumnId, overData.componentId ?? "");
        }
      } else if (overData.type === "column-end") {
        toColumnId = overData.columnId ?? "";
        const column = toColumnId ? findColumn(toColumnId)?.column : null;
        toIndex = column ? column.components.length : -1;
      }
      if (toIndex >= 0 && toColumnId && activeData.componentId) {
        const fromIndex = getComponentIndex(fromColumnId, activeData.componentId);
        if (fromColumnId === toColumnId && fromIndex >= 0 && fromIndex < toIndex) {
          toIndex += 1;
        }
      }
      if (toColumnId && toIndex >= 0) {
        dispatch(
          moveComponent({
            componentId: activeData.componentId,
            fromColumnId,
            toColumnId,
            toIndex,
            duplicate,
          })
        );
      }
      return;
    }

    if (activeData.type === "palette") {
      const componentType = activeData.componentType;
      if (!componentType) return;
      let toColumnId = "";
      let toIndex = -1;
      if (overData.type === "component") {
        toColumnId = overData.columnId ?? "";
        if (toColumnId) {
          toIndex = getComponentIndex(toColumnId, overData.componentId ?? "");
        }
      } else if (overData.type === "column-end") {
        toColumnId = overData.columnId ?? "";
        const column = toColumnId ? findColumn(toColumnId)?.column : null;
        toIndex = column ? column.components.length : -1;
      }
      if (toColumnId && toIndex >= 0) {
        dispatch(addComponent({ columnId: toColumnId, type: componentType, index: toIndex }));
      }
    }
  }

  const selectedComponent = useMemo(() => {
    if (!selection.selectedId || selection.selectedType !== "component") return null;
    for (const section of page.sections) {
      for (const row of section.rows) {
        for (const column of row.columns) {
          const found = column.components.find((item) => item.id === selection.selectedId);
          if (found) return found;
        }
      }
    }
    return null;
  }, [page, selection.selectedId, selection.selectedType]);

  const sectionIds = page.sections.map((section) => sortableId("section", section.id));

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div className="editor-toolbar-group">
          <label className="toolbar-field">
            Page Title
            <input
              value={page.title ?? ''}
              onChange={(event) =>
                dispatch(updatePageMeta({ title: event.target.value }))
              }
              placeholder="Untitled Page"
            />
          </label>
          <label className="toolbar-field">
            Slug
            <input
              value={slug}
              readOnly
              placeholder="Page slug"
              title="Slug is set from admin. Edit from /admin/pages"
            />
          </label>
          <button className="btn" onClick={() => dispatch(addSection())}>
            <Plus size={16} /> Add Section
          </button>
          <button className="btn" onClick={save}>
            Save
          </button>
          <span className="status-pill">{status}</span>
        </div>
        <div className="editor-toolbar-group">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch(undo())}
            disabled={history.past.length === 0}
          >
            Undo
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch(redo())}
            disabled={history.future.length === 0}
          >
            Redo
          </button>
          <Link
            className="btn btn-ghost"
            href={`/page/${encodeURIComponent(slug)}`}
          >
            View Page
          </Link>
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="language-select"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="editor-body">
          <div
            className="editor-canvas"
            onClick={() => dispatch(clearSelection())}
          >
            <SortableContext
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              {page.sections.map((section, sectionIndex) => (
                <div key={section.id}>
                  <SectionDropZone index={sectionIndex} />
                  <SortableSection
                    section={section}
                    isCollapsed={selection.collapsedSectionIds.includes(
                      section.id,
                    )}
                    onToggleCollapse={() =>
                      dispatch(toggleSectionCollapse({ sectionId: section.id }))
                    }
                    onAddRow={() => dispatch(addRow({ sectionId: section.id }))}
                    onDeleteSection={() =>
                      dispatch(deleteSection({ sectionId: section.id }))
                    }
                  >
                    <SortableContext
                      items={section.rows.map((row) =>
                        sortableId('row', row.id),
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      {section.rows.map((row) => (
                        <SortableRow
                          key={row.id}
                          row={row}
                          sectionId={section.id}
                          columnCount={row.columns.length}
                          onAddColumn={() =>
                            dispatch(addColumn({ rowId: row.id }))
                          }
                          onDeleteRow={() =>
                            dispatch(deleteRow({ rowId: row.id }))
                          }
                        >
                          <SortableContext
                            items={row.columns.map((column) =>
                              sortableId('column', column.id),
                            )}
                            strategy={rectSortingStrategy}
                          >
                            {row.columns.map((column) => (
                              <SortableColumn
                                key={column.id}
                                column={column}
                                rowId={row.id}
                                sectionId={section.id}
                                onSelectColumn={() =>
                                  dispatch(
                                    selectNode({
                                      id: column.id,
                                      type: 'column',
                                    }),
                                  )
                                }
                                onUpdateSpan={(span) =>
                                  dispatch(
                                    updateColumnSpan({
                                      columnId: column.id,
                                      span,
                                    }),
                                  )
                                }
                                onDeleteColumn={() =>
                                  dispatch(
                                    deleteColumn({ columnId: column.id }),
                                  )
                                }
                              >
                                <SortableContext
                                  items={column.components.map((component) =>
                                    sortableId('component', component.id),
                                  )}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {column.components.map((component) => (
                                    <SortableComponent
                                      key={component.id}
                                      component={component}
                                      columnId={column.id}
                                      rowId={row.id}
                                      sectionId={section.id}
                                      isSelected={
                                        selection.selectedId === component.id
                                      }
                                      onSelect={() =>
                                        dispatch(
                                          selectNode({
                                            id: component.id,
                                            type: 'component',
                                          }),
                                        )
                                      }
                                      onDelete={() =>
                                        dispatch(
                                          deleteComponent({
                                            componentId: component.id,
                                          }),
                                        )
                                      }
                                    />
                                  ))}
                                  <ColumnEndDrop columnId={column.id} />
                                </SortableContext>
                              </SortableColumn>
                            ))}
                            <RowEndDrop rowId={row.id} />
                          </SortableContext>
                        </SortableRow>
                      ))}
                      <SectionEndDrop sectionId={section.id} />
                    </SortableContext>
                  </SortableSection>
                </div>
              ))}
              <SectionDropZone index={page.sections.length} />
            </SortableContext>
          </div>

          <aside className="editor-inspector">
            <div className="inspector-palette">
              <h3 className="mb20">Inspector</h3>
              {selectedComponent ? (
                <ComponentInspector
                  component={selectedComponent}
                  onUpdate={(patch) =>
                    dispatch(
                      updateComponentProps({
                        componentId: selectedComponent.id,
                        patch,
                      }),
                    )
                  }
                />
              ) : (
                <div className="inspector-placeholder" aria-hidden="true">
                  <div className="inspector-placeholder-title" />
                  <div className="inspector-placeholder-line" />
                  <div className="inspector-placeholder-line" />
                  <div className="inspector-placeholder-line" />
                  <div className="inspector-placeholder-block" />
                  <div className="inspector-placeholder-line" />
                  <div className="inspector-placeholder-line short" />
                </div>
              )}
            </div>
            <div className="component-palette">
              <h4>Components</h4>
              <div className="component-palette-list">
                {COMPONENT_TYPES.map((type) => (
                  <PaletteItem key={type} type={type} />
                ))}
              </div>
            </div>
          </aside>
        </div>
        <DragOverlay>
          {activeDrag ? (
            <div className="dnd-overlay">{activeDrag.label}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function PaletteItem({ type }: { type: BuilderComponent["type"] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { type: "palette", componentType: type } satisfies DragMeta,
  });

  return (
    <div
      ref={setNodeRef}
      className={`component-palette-item${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="palette-icon">{getComponentIcon(type)}</span>
      <span className="palette-label">{type}</span>
    </div>
  );
}

function SortableSection({
  section,
  isCollapsed,
  onToggleCollapse,
  onAddRow,
  onDeleteSection,
  children,
}: {
  section: PageSchema["sections"][number];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddRow: () => void;
  onDeleteSection: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: sortableId("section", section.id),
      data: { type: "section", sectionId: section.id } satisfies DragMeta,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`editor-section${isCollapsed ? " is-collapsed" : ""}`}
    >
      <div className="editor-section-header">
        <div className="editor-header-left">
          <button className="btn btn-ghost btn-icon" type="button" onClick={onToggleCollapse} title={isCollapsed ? "Expand" : "Collapse"}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            className="btn btn-ghost btn-icon editor-drag-handle"
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            title="Move section"
          >
            <GripVertical size={16} />
          </button>
          <span>Section</span>
        </div>
        <div className="editor-actions">
          <button className="btn btn-ghost btn-sm" onClick={onAddRow}>
            <Plus size={14} /> Add Row
          </button>
          <button className="btn btn-ghost btn-sm btn-danger" onClick={onDeleteSection}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
      {isCollapsed ? null : children}
    </div>
  );
}

function SortableRow({
  row,
  sectionId,
  columnCount,
  onAddColumn,
  onDeleteRow,
  children,
}: {
  row: PageSchema["sections"][number]["rows"][number];
  sectionId: string;
  columnCount: number;
  onAddColumn: () => void;
  onDeleteRow: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: sortableId("row", row.id),
      data: { type: "row", rowId: row.id, sectionId } satisfies DragMeta,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="editor-row">
      <div className="editor-row-header">
        <div className="editor-header-left">
          <button
            className="btn btn-ghost btn-icon editor-drag-handle"
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            title="Move row"
          >
            <GripVertical size={16} />
          </button>
          <span>Row</span>
        </div>
        <div className="editor-actions">
          <button className="btn btn-ghost btn-sm" onClick={onAddColumn}>
            <Plus size={14} /> Add Column
          </button>
          <button className="btn btn-ghost btn-sm btn-danger" onClick={onDeleteRow}>
            <Trash2 size={14} /> Delete Row
          </button>
        </div>
      </div>
      <div className="editor-columns" style={{ "--col-count": columnCount } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

function SortableColumn({
  column,
  rowId,
  sectionId,
  onSelectColumn,
  onUpdateSpan,
  onDeleteColumn,
  children,
}: {
  column: PageSchema["sections"][number]["rows"][number]["columns"][number];
  rowId: string;
  sectionId: string;
  onSelectColumn: () => void;
  onUpdateSpan: (span: number) => void;
  onDeleteColumn: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: sortableId("column", column.id),
      data: { type: "column", columnId: column.id, rowId, sectionId } satisfies DragMeta,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };
  const mergedStyle = { ...style, "--span": column.span } as CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={mergedStyle}
      className="editor-column"
      onClick={(event) => {
        event.stopPropagation();
        onSelectColumn();
      }}
    >
      <div className="editor-column-header">
        <div className="editor-header-left">
          <button
            className="btn btn-ghost btn-icon editor-drag-handle"
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            title="Move column"
          >
            <GripVertical size={16} />
          </button>
          <span>Column ({column.span}/12)</span>
        </div>
        <div className="editor-actions">
          <label>
            Span
            <input
              type="number"
              min={1}
              max={12}
              value={column.span}
              onChange={(event) => onUpdateSpan(Number(event.target.value))}
            />
          </label>
          <button
            className="btn btn-ghost btn-sm btn-danger"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteColumn();
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="editor-component-list">
        {children}
      </div>
    </div>
  );
}

function SortableComponent({
  component,
  columnId,
  rowId,
  sectionId,
  isSelected,
  onSelect,
  onDelete,
}: {
  component: BuilderComponent;
  columnId: string;
  rowId: string;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId("component", component.id),
    data: { type: "component", componentId: component.id, columnId, rowId, sectionId } satisfies DragMeta,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="editor-component-slot">
      <div
        className={`editor-component-card${isSelected ? ' selected' : ''}`}
        {...attributes}
        {...listeners}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <div className="editor-component-label">
          <div className="editor-component-meta">
            <span className="editor-component-icon">
              {getComponentIcon(component.type)}
            </span>
            <span>{component.type}</span>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-danger"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
        <div className="editor-component-preview">
          <ComponentRenderer component={component} />
        </div>
      </div>
    </div>
  );
}

function ColumnEndDrop({ columnId }: { columnId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-end:${columnId}`,
    data: { type: "column-end", columnId } satisfies DragMeta,
  });

  return (
    <div ref={setNodeRef} className={`dnd-drop-zone${isOver ? " is-over" : ""}`}>
      <div className="editor-drop-slot" />
      <div className="editor-drop-hint">Drag components here</div>
    </div>
  );
}

function RowEndDrop({ rowId }: { rowId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `row-end:${rowId}`,
    data: { type: "row-end", rowId } satisfies DragMeta,
  });

  return (
    <div ref={setNodeRef} className={`dnd-drop-zone${isOver ? " is-over" : ""}`}>
      <div className="editor-column-drop-slot" />
    </div>
  );
}

function SectionEndDrop({ sectionId }: { sectionId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-end:${sectionId}`,
    data: { type: "section-end", sectionId } satisfies DragMeta,
  });

  return (
    <div ref={setNodeRef} className={`dnd-drop-zone${isOver ? " is-over" : ""}`}>
      <div className="editor-row-drop-slot" />
    </div>
  );
}

function PageEndDrop() {
  const { setNodeRef, isOver } = useDroppable({
    id: "page-end",
    data: { type: "page-end" } satisfies DragMeta,
  });

  return (
    <div ref={setNodeRef} className={`dnd-drop-zone${isOver ? " is-over" : ""}`}>
      <div className="editor-section-drop-slot" />
    </div>
  );
}

function SectionDropZone({ index }: { index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-drop:${index}`,
    data: { type: "section-drop", index } satisfies DragMeta,
  });

  return (
    <div ref={setNodeRef} className={`dnd-drop-zone${isOver ? " is-over" : ""}`}>
      <div className="editor-section-drop-slot" />
    </div>
  );
}

function ComponentInspector({
  component,
  onUpdate,
}: {
  component: BuilderComponent;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const parseNumberInput = (value: string) => {
    if (value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  switch (component.type) {
    case "text":
      const fontSize = typeof component.props.fontSize === "number" ? component.props.fontSize : "";
      const lineHeight = typeof component.props.lineHeight === "number" ? component.props.lineHeight : "";
      const fontWeight =
        typeof component.props.fontWeight === "number" || typeof component.props.fontWeight === "string"
          ? String(component.props.fontWeight)
          : "";
      const color = typeof component.props.color === "string" ? component.props.color : "#0f172a";
      return (
        <div className="inspector-stack">
          <label className="inspector-field">
            Text
            <textarea
              value={typeof component.props.text === "string" ? component.props.text : ""}
              onChange={(event) => onUpdate({ text: event.target.value })}
            />
          </label>
          <label className="inspector-field">
            Font size (px)
            <input
              type="number"
              min={8}
              max={200}
              value={fontSize}
              onChange={(event) => onUpdate({ fontSize: parseNumberInput(event.target.value) })}
            />
          </label>
          <label className="inspector-field">
            Line height
            <input
              type="number"
              min={0.5}
              step={0.1}
              value={lineHeight}
              onChange={(event) => onUpdate({ lineHeight: parseNumberInput(event.target.value) })}
            />
          </label>
          <label className="inspector-field">
            Font weight
            <select
              value={fontWeight}
              onChange={(event) =>
                onUpdate({
                  fontWeight: event.target.value ? Number(event.target.value) : undefined,
                })
              }
            >
              <option value="">Default</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </label>
          <label className="inspector-field">
            Color
            <input
              type="color"
              value={color}
              onChange={(event) => onUpdate({ color: event.target.value })}
            />
          </label>
        </div>
      );
    case "button":
      return (
        <div className="inspector-stack">
          <label className="inspector-field">
            Label
            <input
              value={typeof component.props.label === "string" ? component.props.label : ""}
              onChange={(event) => onUpdate({ label: event.target.value })}
            />
          </label>
          <label className="inspector-field">
            Href
            <input
              value={typeof component.props.href === "string" ? component.props.href : "#"}
              onChange={(event) => onUpdate({ href: event.target.value })}
            />
          </label>
        </div>
      );
    case "image":
      const imageSrc = typeof component.props.src === "string" ? component.props.src : "";
      const imageAlt = typeof component.props.alt === "string" ? component.props.alt : "";
      return (
        <div className="inspector-stack">
          <button className="btn btn-ghost" type="button" onClick={() => setMediaOpen(true)}>
            Browse media
          </button>
          <label className="inspector-field">
            Image URL
            <input
              value={imageSrc}
              onChange={(event) => onUpdate({ src: event.target.value })}
            />
          </label>
          <label className="inspector-field">
            Alt text
            <input
              value={imageAlt}
              onChange={(event) => onUpdate({ alt: event.target.value })}
            />
          </label>
          {imageSrc ? <img className="inspector-image-preview" src={imageSrc} alt={imageAlt} /> : null}
          <MediaLibraryModal
            open={mediaOpen}
            onClose={() => setMediaOpen(false)}
            onSelect={(items) => {
              const selected = items[0];
              if (!selected) return;
              onUpdate({
                src: selected.url,
                alt: selected.alt ?? selected.title ?? "",
                mediaId: selected.id,
              });
              setMediaOpen(false);
            }}
          />
        </div>
      );
    case "gallery":
      const galleryItems = Array.isArray(component.props.items)
        ? (component.props.items as MediaItem[]).filter(
            (item) => item && typeof item.url === "string" && typeof item.id === "string"
          )
        : [];
      const columns = typeof component.props.columns === "number" ? component.props.columns : 3;
      const gap = typeof component.props.gap === "number" ? component.props.gap : 12;

      return (
        <div className="inspector-stack">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setGalleryOpen(true)}
          >
            Add from media library
          </button>
          <div className="inspector-gallery-grid">
            {galleryItems.map((item) => (
              <div key={item.id} className="inspector-gallery-item">
                <img src={item.url} alt={item.alt ?? item.title ?? ''} />
                <button
                  className="btn btn-ghost btn-sm btn-danger"
                  type="button"
                  onClick={() =>
                    onUpdate({
                      items: galleryItems.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <label className="inspector-field">
            Columns
            <input
              type="number"
              min={1}
              max={8}
              value={columns}
              onChange={(event) =>
                onUpdate({ columns: parseNumberInput(event.target.value) })
              }
            />
          </label>
          <label className="inspector-field">
            Gap (px)
            <input
              type="number"
              min={0}
              max={120}
              value={gap}
              onChange={(event) =>
                onUpdate({ gap: parseNumberInput(event.target.value) })
              }
            />
          </label>
          <label className="inspector-field">
            Border Radius (px)
            <input
              type="number"
              min={0}
              max={50}
              value={
                typeof component.props.borderRadius === 'number'
                  ? component.props.borderRadius
                  : 0
              }
              onChange={(event) =>
                onUpdate({ borderRadius: parseNumberInput(event.target.value) })
              }
            />
          </label>
          <MediaLibraryModal
            open={galleryOpen}
            multiple
            onClose={() => setGalleryOpen(false)}
            onSelect={(items) => {
              const merged = new Map<string, MediaItem>();
              galleryItems.forEach((item) => merged.set(item.id, item));
              items.forEach((item) =>
                merged.set(item.id, {
                  id: item.id,
                  url: item.url,
                  alt: item.alt,
                  title: item.title,
                  fileType: item.fileType,
                  size: item.size,
                  createdAt: item.createdAt,
                }),
              );
              onUpdate({ items: Array.from(merged.values()) });
              setGalleryOpen(false);
            }}
          />
        </div>
      );
    case "spacer":
      return (
        <label className="inspector-field">
          Height
          <input
            type="number"
            min={0}
            value={typeof component.props.height === "number" ? component.props.height : 24}
            onChange={(event) => onUpdate({ height: Number(event.target.value) })}
          />
        </label>
      );
    default:
      return <p className="muted">No inspector for this component.</p>;
  }
}
