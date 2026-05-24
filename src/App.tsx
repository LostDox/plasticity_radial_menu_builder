import React, {useState, useMemo, useEffect} from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { useListItemStore, useGlobalMenuItemStore } from "@/stores/store";
import { customDropAnimation, sectorCollisionDetection } from "@/utils/util"
import CommandList from "@/components/commandList";
import { ConfigProvider, theme } from 'antd';
import { DragStartEvent } from "@dnd-kit/core/dist/types/events";
import './App.css'
import { GlobalRadialMenuItem, RadialMenuItem } from "@/types/type";
import OperatedPanel from "@/components/operatedPanel";
import { AnimatePresence } from 'motion/react'
import EditableText from "@/components/EditableText.tsx";
import TabTitle from "@/components/TabTitle.tsx";

const App:React.FC = () => {
    const { undo, redo, canUndo, canRedo } = useGlobalMenuItemStore();

    const { listItems, setListItems } = useListItemStore();
    const { globalMenuItems, setGlobalMenuItems } = useGlobalMenuItemStore();

    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [overlayText, setOverlayText] = useState("Curve");
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const currentRadialItems = (globalMenuItems[activeIndex] || globalMenuItems[0] || { items: [] }).items;
    
    const activeColor = globalMenuItems[activeIndex]?.color || '#7A3DE8';

    const size = {
        width: 500,
        height: 500,
    }

    const radialMenuCommands = useMemo(() => {
        // NEW: Grab the color from the global menu items
        return globalMenuItems.map(item => ({name: item.name, command: item.command, color: item.color}))
    },[globalMenuItems])
useEffect(() => {
        const rads:RadialMenuItem[] = radialMenuCommands.map(item => ({
            id: 'radMenu_'+item.command, 
            label: item.name, 
            icon: 'radial', 
            command: 'view:radial:'+item.command,
            color: item.color // NEW: Inject the color into the draggable tool blueprint!
        }))

        const listItemsWithoutRads = listItems.slice(1)
        const newListItems = [
            {
                commandType: 'Radial Menus',
                commandType_zh: '环形菜单类',
                items: rads.filter((_, index) => index !== activeIndex)
            },
            ...listItemsWithoutRads
        ]
        setListItems(newListItems)

    },[globalMenuItems, radialMenuCommands, activeIndex])

    const flatListItems= useMemo(() => listItems.flatMap((item) => item.items), [listItems])

    const handleSwitch = (index: number) => {
        const newDirection = (index - activeIndex)>0?-1:1;
        setDirection(newDirection);
        setActiveIndex(index);
    }

    const handleItemsChange = (newItems: GlobalRadialMenuItem[]) => {
        setGlobalMenuItems(newItems)
        if(newItems.length< globalMenuItems.length) {
            if(activeIndex>0) {
                handleSwitch(newItems.length-1)
            }
        } else {
            const currentCommand = globalMenuItems[activeIndex].command;
            const newIndex = newItems.findIndex((item)=>item.command === currentCommand);
            if(newIndex>-1) {
                if(globalMenuItems.length<newItems.length){
                    handleSwitch(newIndex+1)
                } else {
                    handleSwitch(newIndex)
                }
            } else {
                if(activeIndex>0) handleSwitch(activeIndex-1)
                else handleSwitch(0)
            }
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        const {active} = event;
        if(active.data.current?.label) {
            setShowOverlay(true)
            setOverlayText(active.data.current.label)
        } else {
            setShowOverlay(false)
        }
    }

    const handleDragOver = (event: DragEndEvent) => {
        const { active, over } = event;
        if(!currentRadialItems.some((item)=>item.id === `radMenu-${active.id}`)
            &&over?.id
            &&currentRadialItems.length<12
        ) {
            const draggedItem = flatListItems.find((item) => item.id === active.id);
            const overIndex = currentRadialItems.findIndex((item) => item.id === over.id);

            if (!draggedItem) return;
            const addItem = {...draggedItem, id:`radMenu-${draggedItem.id}` };

            const filteredItems = currentRadialItems.filter(item => item.id !== draggedItem.id);

            const newItems = [
                ...filteredItems.slice(0, overIndex),
                addItem,
                ...filteredItems.slice(overIndex)
            ];

            handleItemsChange(globalMenuItems.map((item, index) => index === activeIndex?{...item, items: newItems}:item))
            setShowOverlay(false)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if(over?.id !== 'trashBin') {
            if (active.id !== over?.id) {
                const oldIndex = currentRadialItems.findIndex((item) => item.id === active.id);
                const newIndex = currentRadialItems.findIndex((item) => item.id === over?.id);

                if (oldIndex === -1) return; 

                let newItems = currentRadialItems;
                
                if(newIndex>-1&&oldIndex>-1) {
                    newItems = arrayMove(currentRadialItems, oldIndex, newIndex);
                }

                handleItemsChange(globalMenuItems.map((item, index) => index === activeIndex?{...item, items: newItems}:item))
            }
        } else {
            if(currentRadialItems.length>2) {
                setGlobalMenuItems(prev => prev.map((item, index) => index === activeIndex?{...item, items: item.items.filter(menuItem => menuItem.id !== active.id)}:item));
            }
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    return (
        <ConfigProvider
        theme={{
            token: {
                colorPrimary: activeColor, 
            },
            components: {
                Segmented:{
                    itemSelectedBg: 'rgba(255, 255, 255, 0.2)',
                    itemHoverBg: 'rgba(255, 255, 255, 0.15)',
                },
            },
            algorithm: theme.darkAlgorithm,
        }}
        >
            <div 
                className="app-container relative flex w-screen h-screen box-border p-6 justify-center items-center selection:text-neutral-200 overflow-hidden transition-colors duration-500"
                style={{ background: `radial-gradient(circle at center, ${activeColor}25 0%, #262626 45%, #171717 100%)` }}
            >
              <DndContext
                  collisionDetection={sectorCollisionDetection}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
              >
                  <SortableContext items={currentRadialItems}>
                      <div className="flex flex-1 self-stretch max-w-[1440px] z-10">
                        <div className="flex h-full flex-1 flex-col justify-center items-center">
                            <div className="flex flex-col pt-6 pb-6">
                                <EditableText
                                    keyStr='name'
                                    indexes={[activeIndex]}
                                    className='text-white'
                                    publicClassNames='text-4xl gabarito-bold border-b-1'
                                    editableClassNames='border-b-neutral-500 outline-0'
                                    normalClassNames='border-transparent'
                                />
                                <div className="flex items-baseline gap-1">
                                    <span className='py-1 px-1 rounded-sm text-neutral-300 bg-neutral-700 text-xs'>Command</span>
                                    <EditableText
                                        keyStr='command'
                                        indexes={[activeIndex]}
                                        className='text-neutral-400'
                                        publicClassNames='gabarito-regular text-lg border-b-1'
                                        editableClassNames='border-b-neutral-500 outline-0'
                                        normalClassNames='border-transparent'
                                        tooltipPlacement='bottom'
                                    />
                                </div>
                            </div>
                            <AnimatePresence
                                custom={{direction, globalMenuItems}}
                                mode="popLayout"
                            >
                                <div
                                    key={`parent-${activeIndex}`}
                                    className="relative w-full h-full flex flex-col justify-center items-center self-stretch overflow-hidden">
                                        <OperatedPanel
                                            menuItem={globalMenuItems[activeIndex]}
                                            size={size}
                                            activeColor={activeColor} 
                                        />
                                </div>
                            </AnimatePresence>
                            <TabTitle
                                index={activeIndex}
                                globalItems={globalMenuItems}
                                onItemsChange={handleItemsChange}
                                onSwitch={handleSwitch}
                            />
                        </div>
                        <AnimatePresence mode="popLayout">
                            <div
                                key={`parent-commandList-${activeIndex}-`}
                                className='self-stretch flex relative'
                                style={{width: 390}}
                            >
                                <CommandList refItems={currentRadialItems} activeColor={activeColor} />
                            </div>
                        </AnimatePresence>
                        {showOverlay && <DragOverlay
                            dropAnimation={customDropAnimation}
                        >
                            <div
                                className='p-2 text-sm bg-violet-700 cursor-grabbing gabarito-bold text-white rounded-sm'
                                style={{ backgroundColor: activeColor }}
                            >
                                {overlayText}
                            </div>
                        </DragOverlay>}
                      </div>
                  </SortableContext>
              </DndContext>
            </div>
        </ConfigProvider>
    )
}

export default App