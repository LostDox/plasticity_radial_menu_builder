import React, { useMemo, useState, useRef } from "react";
import { Segmented, Button, Space, Tooltip, message, Popconfirm, Dropdown, MenuProps } from 'antd';
import { PlusOutlined, DownloadOutlined, DeleteOutlined, WarningOutlined, CopyOutlined, UndoOutlined, RedoOutlined, DownOutlined, FolderOpenOutlined, EditOutlined } from "@ant-design/icons";
import { GlobalRadialMenuItem } from "@/types/type";
import { useGlobalMenuItemStore } from "@/stores/store";
import type { PopconfirmProps } from 'antd';
import NewMenuModal from "@/components/NewMenuModal.tsx";

const Tabunit:React.FC<{
    index: number;
    label: string;
    onDelete: (index: number) => void;
    onEdit: (index: number) => void;
}> = ({ label, onEdit, index }) => {

    return (
        <Tooltip
            title={label}
            trigger='hover'
        >
            <span
                className="py-1 inline-flex items-center gap-1.5 group/edit-tab"
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit(index);
                }}
            >
                <span>{label}</span>
                <EditOutlined
                    className="text-xs opacity-0 group-hover/edit-tab:opacity-100 transition-opacity cursor-pointer text-neutral-500 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(index);
                    }}
                />
            </span>
        </Tooltip>
    )
}

const TabTitle:React.FC< {
    index: number;
    globalItems: GlobalRadialMenuItem[];
    onSwitch: (index:number) => void;
    onItemsChange: (newItems: GlobalRadialMenuItem[]) => void;
}> = ({index, globalItems, onSwitch, onItemsChange}) => {

    const [isModalOpen, setModalOpen] = useState(false);
    const [editModalIndex, setEditModalIndex] = useState<number | null>(null);
    const { undo, redo, canUndo, canRedo } = useGlobalMenuItemStore();
    const [messageApi, contextHolder] = message.useMessage();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDuplicate = (index: number) => {
        const menuToCopy = globalItems[index];
        const newName = menuToCopy.name + " (Copy)";
        const newCommand = menuToCopy.command + "-copy-" + Date.now();

        const duplicatedMenu = {
            ...menuToCopy,
            name: newName,
            command: newCommand,
        };

        const newItems = [...globalItems];
        newItems.splice(index + 1, 0, duplicatedMenu);
        onItemsChange(newItems);
    }

    const handleMenuDelete = (index:number) => {
        onItemsChange(globalItems.filter((_, idx:number) => idx !== index));
    }

    const globalItemsOnlyName = useMemo(() => globalItems.map(item => item.name), [globalItems])

    const segmentOptions = useMemo(() => {
        return globalItems.map((item, idx) => ({
            value: item.name,
            label: (
                <Tabunit
                    index={idx}
                    label={item.name}
                    onDelete={handleMenuDelete}
                    onEdit={handleEdit}
                />
            ),
        }))
    }, [globalItems.length, globalItemsOnlyName])


    const handleMenuSwitch = (value: string) => {
        const tempIndex = segmentOptions.findIndex(option => option.value === value);
        onSwitch(tempIndex);
    }

    const handleAdd = () => {
        setModalOpen(true);
    }

    const handleEdit = (editIndex: number) => {
        setEditModalIndex(editIndex);
    }

    const downloadJson = (menuItem: GlobalRadialMenuItem) => {
        const data = {
            name: menuItem.name,
            command: menuItem.command,
            color: menuItem.color, 
            items: menuItem.items.map(item => ({
                command: item.command,
                icon: item.icon,
                label: item.label, 
            }))
        }

        try {
            // Clean file name: exactly the menu name + .radial.json
            const fileName = `${menuItem.name}.radial.json`;

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export JSON:', error);
        }
    }

    const handleExportCurrent = () => {
        downloadJson(globalItems[index]);
        messageApi.success(`Exported ${globalItems[index].name}`);
    }

    const handleExportAll = () => {
        globalItems.forEach((item, i) => {
            setTimeout(() => {
                downloadJson(item);
            }, i * 300); 
        });
        messageApi.success(`Exported ${globalItems.length} menus`);
    }

    const handleExportWorkspace = () => {
        try {
            // Clean file name for workspace backup as well
            const fileName = `plasticity_workspace.json`;
            const jsonString = JSON.stringify(globalItems, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            messageApi.success('Workspace backup exported!');
        } catch (error) {
            console.error('Failed to export workspace:', error);
            messageApi.error('Failed to export workspace');
        }
    }

    const handleImportWorkspace = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
            
            const parsedData = JSON.parse(content as string);
            
            if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].hasOwnProperty('command') && parsedData[0].hasOwnProperty('items')) {
                onItemsChange(parsedData);
                onSwitch(0); 
                messageApi.success('Workspace restored successfully!');
            } else {
                messageApi.error('Invalid workspace file format');
            }
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to read the file');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const exportMenuProps: MenuProps = {
        items: [
            { key: 'current', label: 'Export Current Menu (For Plasticity)' },
            { key: 'all', label: 'Export All Menus (For Plasticity)' },
            { type: 'divider' },
            { key: 'workspace', label: 'Export Full Workspace (Backup)' },
        ],
        onClick: (e) => {
            if (e.key === 'current') handleExportCurrent();
            if (e.key === 'all') handleExportAll();
            if (e.key === 'workspace') handleExportWorkspace();
        }
    };

    const confirmDelete: PopconfirmProps['onConfirm'] = () => {
        handleMenuDelete(index);
        messageApi.success('Radial menu has been removed');
    };

    const handleSubmit = async (item:GlobalRadialMenuItem) => {
        setModalOpen(false);
        const copyGlobalItems = globalItems.slice()
        copyGlobalItems.splice(index+1, 0, item)
        onItemsChange(copyGlobalItems)
    }

    const handleEditSubmit = async (item: GlobalRadialMenuItem) => {
        setEditModalIndex(null);
        const newItems = globalItems.map((oldItem, i) =>
            i === editModalIndex ? item : oldItem
        );
        onItemsChange(newItems);
    }

    const editItem = editModalIndex !== null ? globalItems[editModalIndex] : null;

    return (
        <div className="p-6 flex justify-between items-center gap-4">
            <NewMenuModal visible={isModalOpen} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)}/>
            <NewMenuModal
                visible={editModalIndex !== null}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditModalIndex(null)}
                editItem={editItem}
            />
            
            <input 
                type="file" 
                accept=".json" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={handleImportWorkspace} 
            />

            <Segmented
                value={segmentOptions[index].value}
                size="large"
                options={segmentOptions}
                onChange={handleMenuSwitch}
                className='select-none gabarito-regular'
            />
            {contextHolder}
            <Space.Compact size="large">
                <Popconfirm
                    icon={<WarningOutlined />}
                    title="Delete Radial Menu"
                    description="Are you sure you want to delete this menu?"
                    onConfirm={confirmDelete}
                    okText="Yes"
                    cancelText="No"
                >
                    <Tooltip title="Delete Menu">
                        <Button disabled={segmentOptions.length < 2} icon={<DeleteOutlined/>}/>
                    </Tooltip>
                </Popconfirm>
                <Tooltip title="Add Menu">
                    <Button type="default" onClick={handleAdd} icon={<PlusOutlined/>}/>
                </Tooltip>

                <Tooltip title="Duplicate Menu">
                    <Button onClick={() => handleDuplicate(index)} icon={<CopyOutlined/>}/>
                </Tooltip>

                <Tooltip title="Undo">
                    <Button 
                        onClick={undo} 
                        disabled={!canUndo()} 
                        icon={<UndoOutlined/>}
                    />
                </Tooltip>
                <Tooltip title="Redo">
                    <Button 
                        onClick={redo} 
                        disabled={!canRedo()} 
                        icon={<RedoOutlined/>}
                    />
                </Tooltip>

                <Popconfirm
                    icon={<WarningOutlined />}
                    title="Import Workspace"
                    description="This will overwrite all your current menus. Continue?"
                    onConfirm={() => fileInputRef.current?.click()}
                    okText="Yes"
                    cancelText="No"
                >
                    <Tooltip title="Restore Workspace Backup">
                        <Button type="default" icon={<FolderOpenOutlined/>}/>
                    </Tooltip>
                </Popconfirm>
                
                <Dropdown.Button 
                    type="primary" 
                    menu={exportMenuProps} 
                    onClick={handleExportCurrent}
                    icon={<DownOutlined />}
                >
                    <DownloadOutlined /> Export
                </Dropdown.Button>
            </Space.Compact>
        </div>
    )
}

export default TabTitle;