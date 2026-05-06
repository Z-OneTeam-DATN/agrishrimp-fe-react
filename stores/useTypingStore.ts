import { create } from "zustand";

interface TypingStore {
  typingByConv: Record<number, boolean>;
  setTyping: (convId: number) => void;
  clearTyping: (convId: number) => void;
}

let timers: Record<number, ReturnType<typeof setTimeout>> = {};

export const useTypingStore = create<TypingStore>((set) => ({
  typingByConv: {},

  setTyping: (convId) => {
    if (timers[convId]) clearTimeout(timers[convId]);
    set((s) => ({ typingByConv: { ...s.typingByConv, [convId]: true } }));
    timers[convId] = setTimeout(() => {
      set((s) => {
        const next = { ...s.typingByConv };
        delete next[convId];
        return { typingByConv: next };
      });
    }, 3000);
  },

  clearTyping: (convId) => {
    if (timers[convId]) clearTimeout(timers[convId]);
    set((s) => {
      const next = { ...s.typingByConv };
      delete next[convId];
      return { typingByConv: next };
    });
  },
}));
