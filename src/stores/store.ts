import { create } from 'zustand'
import { GlobalRadialMenuItem, listItem } from "@/types/type";

interface GlobalRadialMenuState {
    globalMenuItems: GlobalRadialMenuItem[];
    history: GlobalRadialMenuItem[][];
    historyIndex: number;
    setGlobalMenuItems: (
        updater: GlobalRadialMenuItem[] | ((prev: GlobalRadialMenuItem[]) => GlobalRadialMenuItem[])
    ) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

interface ListItemState {
    listItems: listItem[];
    setListItems: (
        updater: listItem[] | ((prev: listItem[]) => listItem[])
    ) => void;
}

interface ContainerState {
    rect: DOMRect | null;
    setRect: (rect: DOMRect) => void;
}

const useGlobalMenuItemStore = create<GlobalRadialMenuState>((set, get) => ({
    globalMenuItems: [{
        name: 'Default Menu',
        command: 'user:default-menu',
        color: '#8B5CF6',
        items: [
            { id: 'radMenu-163', label: 'Selection mode: set control-point', label_zh: "选择模式：设置控制点", icon: 'selection-mode-set-control-point', command: 'selection:mode:set:control-point' },
            { id: 'radMenu-164', label: 'Selection mode: set edge', label_zh: "选择模式：设置边", icon: 'selection-mode-set-edge', command: 'selection:mode:set:edge' },
            { id: 'radMenu-165', label: 'Selection mode: set face', label_zh: "选择模式：设置面", icon: 'selection-mode-set-face', command: 'selection:mode:set:face' },
            { id: 'radMenu-166', label: 'Selection mode: set solid', label_zh: "选择模式：设置实体", icon: 'selection-mode-set-solid', command: 'selection:mode:set:solid' },
        ]
    }],
    history: [[]],
    historyIndex: 0,

    setGlobalMenuItems: (updater) => {
        set((state) => {
            const newItems = typeof updater === 'function' 
                ? updater(state.globalMenuItems) 
                : updater;

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push([...state.globalMenuItems]);

            return {
                globalMenuItems: newItems,
                history: newHistory,
                historyIndex: newHistory.length - 1,
            };
        });
    },

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            set({
                globalMenuItems: history[historyIndex - 1],
                historyIndex: historyIndex - 1,
            });
        }
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            set({
                globalMenuItems: history[historyIndex + 1],
                historyIndex: historyIndex + 1,
            });
        }
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
}));

const useListItemStore = create<ListItemState>((set) => ({
    listItems: [{
        commandType: 'Radial Menus',
        commandType_zh: '环形菜单类',
        items: []
    }, {
        commandType: 'Commands',
        commandType_zh: '命令',
        items: []
    }],
    setListItems: (updater) => set((state) => ({
        listItems: typeof updater === 'function' ? updater(state.listItems) : updater
    })),
}));

const useContainerStore = create<ContainerState>((set) => ({
    rect: null,
    setRect: (rect) => set({ rect }),
}));

export { useGlobalMenuItemStore, useListItemStore, useContainerStore };
