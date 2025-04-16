'use client'

import Start from "./components/start";
import End from "./components/end";
import { PageSlider } from "@/app/components/page-slider";
import { useState } from "react";

export default function InspirationPages() {
  const [isSecondaryPageVisible, setIsSecondaryPageVisible] = useState(false);
  
  const toggleView = () => {
    setIsSecondaryPageVisible(!isSecondaryPageVisible);
  };
// 页面不要有滚动条
  return (
    <div className="h-screen overflow-hidden ">
      <PageSlider 
        isSecondaryVisible={isSecondaryPageVisible}
        mainPage={<Start onToggleView={toggleView} />}
        secondaryPage={<End onToggleView={toggleView} />}
        transitionDuration={400}
      />
    </div>
  );
}
