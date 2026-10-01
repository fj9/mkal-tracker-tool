import { createContext, useContext } from "react";

/** The MKAL of the clue being shown, so colour names and swatches resolve per MKAL. */
export const MkalContext = createContext<string | undefined>(undefined);
export const useMkal = () => useContext(MkalContext);
