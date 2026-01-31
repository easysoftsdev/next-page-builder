import { configureStore } from "@reduxjs/toolkit";
import builderReducer from "./builderSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    builder: builderReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
