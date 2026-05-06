import React, { useEffect, useState } from "react";
import {iconNameRemap} from "@/utils/util.ts";

interface SvgIconProps {
    name: string;
    inSvg?: boolean;
    style?: React.CSSProperties;
    x?: number;
    y?: number;
    size?: number
}

const SvgIcon:React.FC<SvgIconProps> = ({
                                            name,
                                            inSvg,
                                            x=0,
                                            y=0,
                                            style,
                                            size=16,
}) =>{
    const [isValidIcon, setIsValidIcon] = useState(true);

    useEffect(() => {
        const scriptId = 'iconfont-symbol-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            
            // FIX: Use import.meta.env.BASE_URL to automatically handle GitHub subfolders
            const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, ""); 
            script.src = `${baseUrl}/static/iconfont/font.js`;
            
            script.id = scriptId;
            document.body.appendChild(script);
        }

        let attempts = 0;
        const targetId = `icon-${iconNameRemap(name)}`;

        const checkIcon = setInterval(() => {
            attempts++;
            if (document.getElementById(targetId)) {
                setIsValidIcon(true);
                clearInterval(checkIcon);
            } else if (attempts > 20) {
                setIsValidIcon(false);
                clearInterval(checkIcon);
            }
        }, 50);

        return () => clearInterval(checkIcon);
    }, [name]);

    const core = (
        <g className="icon" style={style}>
            {isValidIcon ? (
                <use href={`#icon-${iconNameRemap(name)}`} x={x} y={y} width={size} height={size}/>
            ) : (
                <circle cx={x + size / 2} cy={y + size / 2} r={size / 4} fill="currentColor" />
            )}
        </g>
    )

    return (
        inSvg?core : <svg width={size} height={size}>{core}</svg>
    )
}

export default SvgIcon;