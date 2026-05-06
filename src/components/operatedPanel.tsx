import React, { useRef, useEffect, useState } from "react";
import RadialMenuPie from "@/components/RadialMenu/radialMenuPie";
import MenuLabel from "@/components/MenuLabel.tsx";
import {GlobalRadialMenuItem} from "@/types/type";
import {motion, usePresenceData} from "motion/react";

interface IProps {
    size: {
        width: number,
        height: number,
    },
    menuItem?: GlobalRadialMenuItem, 
    activeColor?: string, // NEW Prop
}

const variants = {
    enter: (direction: number) => ({
        transform: `translateX(${direction>0?'-100':'100'}%)`,
        opacity: 0,
    }),
    center: {
        transform: "translateX(0%)",
        opacity: 1,
    },
    exit: (direction: number) => ({
        transform: `translateX(${direction>0?'100':'-100'}%)`,
        opacity: 0,
    })
}

const OperatedPanel: React.FC<IProps>= ({
    size,
    menuItem, 
    activeColor, // NEW Prop
}) => {

    const presenceData = usePresenceData();
    const direction = presenceData?.direction || 1;
    
    const currentMenu = menuItem || presenceData?.menuItems;

    const nodeRef = useRef<HTMLDivElement>(null);
    const [maxWidth, setMaxWidth] = useState<number>(400);

    useEffect(() => {
        const wrapper = nodeRef.current?.parentElement as HTMLElement;
        const menu = nodeRef.current
        if(wrapper&&menu) {
            const calculateStretch = () => {
                const wrapWidth = wrapper.offsetWidth;
                const menuWidth = menu.offsetWidth;
                const stretchedAmount = (wrapWidth - menuWidth)/2;
                setMaxWidth(stretchedAmount);
            }

            calculateStretch()

            const resizeObserver = new ResizeObserver(calculateStretch)
            resizeObserver.observe(wrapper)

            return () => resizeObserver.disconnect();
        }
    }, []);

    if (!currentMenu) return null;

    return (
        <motion.div
            className="radial-wrap flex justify-center items-center relative"
            ref={nodeRef}
            style={{ width: size.width , height: size.height }}
            initial={variants.enter(direction)}
            animate={variants.center}
            exit={variants.exit(direction)}
            transition={{
                type: "spring",
                mass: 0.5,
                stiffness: 300,
                damping: 15,
                duration: 0.4
            }}

        >
            <MenuLabel
                menuItem={currentMenu} 
                labelMaxWidth={maxWidth}
                size={size}
                radius={180}
                sparsityRatio={1}
                spacing={20}
                extendLength={1000}
            />
            {/* Pass color down into the pie! */}
            <RadialMenuPie items={currentMenu.items} activeColor={activeColor} /> 
        </motion.div>
    );
};

export default OperatedPanel;