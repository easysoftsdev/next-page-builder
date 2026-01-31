import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SelectionState } from "../types/builder";

const initialState: SelectionState = {
  selectedId: null,
  selectedType: null,
  collapsedSectionIds: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    selectNode(
      state,
      action: PayloadAction<{ id: string; type: SelectionState["selectedType"] }>
    ) {
      state.selectedId = action.payload.id;
      state.selectedType = action.payload.type;
    },
    clearSelection(state) {
      state.selectedId = null;
      state.selectedType = null;
    },
    toggleSectionCollapse(state, action: PayloadAction<{ sectionId: string }>) {
      const index = state.collapsedSectionIds.indexOf(action.payload.sectionId);
      if (index >= 0) {
        state.collapsedSectionIds.splice(index, 1);
      } else {
        state.collapsedSectionIds.push(action.payload.sectionId);
      }
    },
  },
});

export const { selectNode, clearSelection, toggleSectionCollapse } = uiSlice.actions;
export default uiSlice.reducer;
