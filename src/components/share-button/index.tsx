"use client";

import { Button, Hstack, Icon } from "bioloom-ui";
import { useTranslations as useUiTranslations } from "@/compat/next-intl";
export default function ShareButton(){
    const uiText = useUiTranslations();

    return (
        <Button className="share-button"
        
        onClick={()=>{
            var url = location.href;
            navigator.clipboard.writeText(url)
        }
        }
        
        >
            <Hstack className="items-center gap-2"><Icon name="link" color="text" size={16} />
            {uiText("AppStrings.CopyShareLink")}</Hstack>
            
        </Button>

    )
}