"use client";

import { Button, Hstack, Icon } from "bioloom-ui";
import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { IconBaseProps } from "react-icons";
import { useState } from "react";
export default function ShareButton(){
    const uiText = useUiTranslations();
    const [displayCheckIcon, setDisplayCheckIcon] = useState(false)
    return (
        <Button 
        onClick={()=>{
            const timeoutTime = 2500
            var url = location.href;
            navigator.clipboard.writeText(url);

            var text = document.getElementById("copy-link-text");
            if(text != null){
                text.textContent = uiText("AppStrings.LinkCopied");
                setTimeout(()=>text.textContent = uiText("AppStrings.CopyShareLink"), timeoutTime)
            }
            setDisplayCheckIcon(true)
            setTimeout(()=>setDisplayCheckIcon(false), timeoutTime)
        }
        }
        
        >
            <Hstack className="items-center gap-2"><Icon name={displayCheckIcon ? "check" : "link"} color="text" size={16} />
            <span id="copy-link-text">{uiText("AppStrings.CopyShareLink")}</span></Hstack>
            
        </Button>

    )
}