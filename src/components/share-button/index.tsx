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
        title={uiText("AppStrings.CopyShareLink")}
        onClick={(e)=>{
            const timeoutTime = 2500
            var url = location.href;
            navigator.clipboard.writeText(url);

            var button = e.currentTarget
            if(button != null){
                button.title = uiText("AppStrings.LinkCopied");
                setTimeout(()=>{
                    if(button==null) return;
                    button.title = uiText("AppStrings.CopyShareLink")
                }, timeoutTime)
            }
            setDisplayCheckIcon(true)
            setTimeout(()=>setDisplayCheckIcon(false), timeoutTime)
        }
        }
        
        >
            <Hstack className="items-center gap-2"><Icon name={displayCheckIcon ? "check" : "share2"} color="text" size={16} />
            {
                // <span id="copy-link-text">{uiText("AppStrings.CopyShareLink")}</span>
            }
            </Hstack>
            
        </Button>

    )
}