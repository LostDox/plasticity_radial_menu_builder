import React, { useMemo, useEffect, useState } from "react";
import { Form, Input, Modal, message, Upload, UploadProps, UploadFile, FormRule } from 'antd';
import { useGlobalMenuItemStore, useListItemStore } from "@/stores/store";
import { flatListItem, GlobalRadialMenuItem, RadialMenuItem } from "@/types/type";
import { InboxOutlined } from "@ant-design/icons";

const itemTemplate: RadialMenuItem[] = [
    { id: 'radMenu-151', label: 'Selection mode: set control-point', icon: 'selection-mode-set-control-point', command: 'selection:mode:set:control-point' },
    { id: 'radMenu-152', label: 'Selection mode: set edge', icon: 'selection-mode-set-edge', command: 'selection:mode:set:edge' },
    { id: 'radMenu-153', label: 'Selection mode: set face', icon: 'selection-mode-set-face', command: 'selection:mode:set:face' },
    { id: 'radMenu-154', label: 'Selection mode: set solid', icon: 'selection-mode-set-solid', command: 'selection:mode:set:solid' },
]

// A curated palette of vibrant, dark-mode friendly colors
const THEME_COLORS = [
    "#F43F5E", "#EC4899", "#D946EF", "#A855F7", "#8B5CF6", 
    "#6366F1", "#3B82F6", "#0EA5E9", "#06B6D4", "#0D9488", 
    "#14B8A6", "#10B981", "#22C55E", "#F59E0B"
];

const modalStyles = {
    mask: {
        backdropFilter: 'blur(10px)',
    }
};

type FieldType = {
    name: string;
    command: string;
    color: string;
    items: RadialMenuItem[];
};

interface ModalFormProps {
    visible: boolean;              
    onSubmit: (values: GlobalRadialMenuItem) => void; 
    onCancel: () => void;          
    editItem?: GlobalRadialMenuItem | null;
}

const NewMenuModal: React.FC<ModalFormProps> = ({ visible, onCancel, onSubmit, editItem }) => {
    const { globalMenuItems } = useGlobalMenuItemStore();
    const { listItems } = useListItemStore()
    const [form] = Form.useForm();
    const { Dragger } = Upload;
    const [messageApi, contextHolder] = message.useMessage();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    
    // State to track which color circle the user clicked
    const [selectedColor, setSelectedColor] = useState(THEME_COLORS[4]); // Default to Violet

    const isEditing = !!editItem;

    const handleDataLoaded = (values: GlobalRadialMenuItem) => {
        const itemsWithId = values.items.reduce((acc, item) => {
            const targetCommand = flatData.find(data => data.command === item.command)
            if (targetCommand && (acc.findIndex(item => item.command === targetCommand.command) < 0) && acc.length < 12) {
                acc.push({
                    ...item,
                    id: `RadialMenu-${targetCommand.id}`
                })
            }
            return acc
        }, [] as RadialMenuItem[])
        form.setFieldsValue({
            name: values.name,
            command: values.command,
            color: values.color || selectedColor,
            items: itemsWithId
        });
        if (values.color) setSelectedColor(values.color);
    };

    const flatData: flatListItem[] = useMemo(() => listItems.flatMap((category) => category.items.map((item) => ({
        ...item,
        type: category.commandType,
        type_zh: category.commandType_zh,
    }))
    ), [listItems])

    const props: UploadProps = {
        accept: ".radial.json, application/json",
        name: 'file',
        multiple: false,
        fileList: fileList,
        beforeUpload: async (file) => {
            try {
                const content = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });
                const parsedData = JSON.parse(content as string);
                handleDataLoaded(parsedData)
                messageApi.success("JSON parsed successfully")
                setFileList([file])
            } catch (error) {
                console.error(error)
                messageApi.error("Failed to parse JSON file");
            }
            return false;
        },
    };

    const globalMenuList = useMemo(() => {
        return globalMenuItems.map(item => ({
            name: item.name,
            command: item.command,
        }))
    }, [globalMenuItems]);

    // Validation: skip uniqueness check for the item being edited
    const validateMenuName = (_: FormRule, value: string) => {
        if (!value) return Promise.reject("Please enter a name");
        if (globalMenuList.some(item => item.name === value && (!isEditing || item.name !== editItem?.name))) {
            return Promise.reject("Menu name already exists");
        }
        return Promise.resolve();
    };

    const validateCommand = (_: FormRule, value: string) => {
        if (!value) return Promise.reject("Please enter a command");
        if (globalMenuList.some(item => item.command === value && (!isEditing || item.command !== editItem?.command))) {
            return Promise.reject("Command ID already exists");
        }
        return Promise.resolve();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            form.submit();
        } catch (error) {
            console.log('vaild failed', error);
        }
    }

    // Reset or pre-fill when modal opens
    useEffect(() => {
        if (visible) {
            setFileList([])
            if (editItem) {
                // Pre-fill with the item being edited
                const color = editItem.color || THEME_COLORS[4];
                setSelectedColor(color);
                form.setFieldsValue({
                    name: editItem.name,
                    command: editItem.command,
                    color: color,
                    items: editItem.items,
                });
            } else {
                form.resetFields();
                // Pick a random color from the palette when the modal opens!
                const randomStartColor = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
                setSelectedColor(randomStartColor);
                form.setFieldsValue({ color: randomStartColor });
            }
        }
    }, [visible, form, editItem]);

    return (
        <Modal
            centered
            okText={isEditing ? "Save Changes" : "Create Menu"}
            cancelText="Cancel"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            styles={modalStyles}
            title={isEditing ? "Edit Radial Menu" : "Create New Radial Menu"}
        >
            {contextHolder}
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item<FieldType>
                    label="Menu Name"
                    name="name"
                    rules={[
                        { required: true, message: "Please enter a name" },
                        { validator: validateMenuName },
                    ]}
                >
                    <Input placeholder="e.g. My Custom Tools" />
                </Form.Item>
                <Form.Item<FieldType>
                    label="Command ID (used in Plasticity)"
                    name="command"
                    rules={[
                        { required: true, message: "Please enter a command ID" },
                        { validator: validateCommand },
                    ]}
                >
                    <Input placeholder="e.g. user:my-tools" />
                </Form.Item>
                
                {/* The new interactive color palette! */}
                <Form.Item<FieldType> label="Menu Theme Color" name="color">
                    <div className="flex flex-wrap gap-2 pt-1">
                        {THEME_COLORS.map(color => (
                            <div 
                                key={color}
                                onClick={() => {
                                    setSelectedColor(color);
                                    form.setFieldValue('color', color);
                                }}
                                className={`w-8 h-8 rounded-full cursor-pointer transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-neutral-800 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </Form.Item>

                <Form.Item<FieldType> name='items' hidden initialValue={itemTemplate}>
                    <Input hidden />
                </Form.Item>
                <Dragger {...props}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag JSON file to this area to import</p>
                    <p className="ant-upload-hint">Support for a single Plasticity radial menu file.</p>
                </Dragger>
            </Form>
        </Modal>
    )
}

export default NewMenuModal;