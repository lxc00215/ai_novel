import { Button } from "@/components/ui/button";
import { ArrowBigLeft, ArrowLeftIcon } from "lucide-react";



interface GangYaoPageProps{
    onToggleView:()=>void
}
const  GangYaoPage= ({onToggleView}:GangYaoPageProps)=>{
    
    return (
        <main className=" bg-background p-6 relative">
 <div>
            <div className="top-4 right-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={()=>{onToggleView()}}
          // 设置到右上角
          className="rounded-full bg-background  transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
      </div>
        </div>

            </main>
       
    )
}

export default GangYaoPage;