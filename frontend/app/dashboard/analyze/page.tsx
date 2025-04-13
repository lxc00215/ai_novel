'use client'
import {PageSlider} from "@/app/components/page-slider"

import Start from "./Start"

import End from "./End"
import { use, useState } from "react"


const analyzePage = ()=>{

    const [isSecondaryPageVisible,setIsSecondaryPageVisible] = useState(false)
    
    const toggleView = () => {
        setIsSecondaryPageVisible(!isSecondaryPageVisible);
      };
    return <div className="h-screen overflow-hidden">
    <PageSlider 
      isSecondaryVisible={isSecondaryPageVisible}
      mainPage={<Start onToggleView={toggleView} />}
      secondaryPage={<End  />}
      transitionDuration={400}
    />
  </div>
}

export default analyzePage;