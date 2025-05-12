// app/dashboard/inspiration/[id]/components/ChoicesSection.tsx
'use client'

import React from 'react';

interface ChoicesSectionProps {
  displayedChoices: string[];
  handleChoiceSelect: (choice: string) => void;
  isLoadingNextContent: boolean;
}

export default function ChoicesSection({ 
  displayedChoices, 
  handleChoiceSelect,
  isLoadingNextContent
}: ChoicesSectionProps) {
  if (isLoadingNextContent) {
    return null;
  }
  
  return (
    <div className="mt-12 animate-fadeIn">
      <h3 className="text-gray-400 mb-4">选择分支</h3>
      <div className="space-y-2">
        {displayedChoices.map((choice, idx) => (
          <div
            key={idx}
            className="border border-yellow-600 rounded-lg p-3 cursor-pointer hover:bg-gray-900 transition-colors animate-slideIn"
            onClick={() => handleChoiceSelect(choice)}
          >
            <span className="text-yellow-500 mr-2">★</span>
            {choice}
          </div>
        ))}
      </div>
    </div>
  );
}