"use client";
// 将UI部分提取到单独组件
import PricingPageUI from "./PricingPageUI";

export default function PricingPage() {
  // 直接渲染分离的UI组件
  return <PricingPageUI />;
}