import { create } from 'zustand'
import { GlobalRadialMenuItem, listItem} from "@/types/type";
import commandData from '../plasticity-commands.json';

interface GlobalRadialMenuState {
    globalMenuItems: GlobalRadialMenuItem[];
    setGlobalMenuItems: (
        updater: GlobalRadialMenuItem[] | ((prev: GlobalRadialMenuItem[]) => GlobalRadialMenuItem[])
    ) => void
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

const useGlobalMenuItemStore = create<GlobalRadialMenuState>((set) => ({
    globalMenuItems: [
        {
            name: 'Default Menu',
            command: 'user:default-menu',
			color: '#8B5CF6',
            items: [
                { id: 'radMenu-163', label: 'Selection mode: set control-point', label_zh:"选择模式：设置控制点", icon: 'selection-mode-set-control-point', command: 'selection:mode:set:control-point' },
                { id: 'radMenu-164', label: 'Selection mode: set edge', label_zh:"选择模式：设置边", icon: 'selection-mode-set-edge', command: 'selection:mode:set:edge' },
                { id: 'radMenu-165', label: 'Selection mode: set face', label_zh:"选择模式：设置面", icon: 'selection-mode-set-face', command: 'selection:mode:set:face' },
                { id: 'radMenu-166', label: 'Selection mode: set solid', label_zh:"选择模式：设置实体", icon: 'selection-mode-set-solid', command: 'selection:mode:set:solid' },
            ]
        }
    ],
    setGlobalMenuItems: (updater)=>
        set((state) => ({
            globalMenuItems: typeof  updater === 'function' ? updater(state.globalMenuItems): updater
        })),
}))

const useListItemStore = create<ListItemState>((set) => ({
    listItems: [{
        commandType: 'Radial Menus',
        commandType_zh: '环形菜单类',
        items: []
    },{
        commandType: 'Commands',
        commandType_zh: '命令类',
        // This links directly to your Python-generated JSON!
        items: commandData.commandList
    }],
    setListItems: (updater: listItem[] | ((prev: listItem[]) => listItem[])) =>
        set((state) => ({
          listItems: typeof updater === 'function' ? updater(state.listItems) : updater,
    })),
}))

const useContainerStore = create<ContainerState>((set) => ({
    rect: null,
    setRect: (rect) => set({ rect }),
}));

export {useContainerStore, useListItemStore, useGlobalMenuItemStore}