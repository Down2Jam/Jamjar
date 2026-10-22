"use client";

import { Button, Hstack, Icon } from "bioloom-ui";
import { useTranslations as useUiTranslations } from "@/compat/next-intl";
export default function ShareButton(){
    const uiText = useUiTranslations();

    return (
        <Button className="share-button"
        
        onClick={()=>{
            var url = location.href;
            navigator.clipboard.writeText(url);

            var text = document.getElementById("copy-link-text");
            if(text == null) return
            text.textContent = uiText("AppStrings.LinkCopied");
            setTimeout(()=>text.textContent = uiText("AppStrings.CopyShareLink"), 5000)
        }
        }
        
        >
            <Hstack className="items-center gap-2"><Icon name="link" color="text" size={16} />
            <span id="copy-link-text">{uiText("AppStrings.CopyShareLink")}</span></Hstack>
            
        </Button>

    )
}