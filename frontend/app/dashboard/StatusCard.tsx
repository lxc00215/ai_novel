"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  borderColor?: string;
  className?: string;
}

export function StatusCard({
  title,
  value,
  icon,
  iconBgColor,
  trend,
  borderColor = "border-border",
  className
}: StatusCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={cn(
        "border border-border overflow-hidden group hover:shadow-md transition-all duration-300", 
        "border-l-4", 
        borderColor
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
              
              {trend && (
                <div className="flex items-center mt-2">
                  <span className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-emerald-500" : "text-red-500"
                  )}>
                    {trend.isPositive ? "+" : "-"}{trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">vs 上周</span>
                </div>
              )}
            </div>
            
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              iconBgColor
            )}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 