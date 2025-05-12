// app/dashboard/inspiration/[id]/components/CharactersList.tsx
'use client'
import { Character } from '@/app/services/types';

export interface CharactersListProps {
  characters: Character[];
}

export default function CharactersList({ characters }: CharactersListProps) {
  return (
    <div className="flex w-full overflow-x-auto gap-4 mb-8 pb-2 animate-fadeIn">
      {characters.map((char: Character, idx: number) => (
        <div
          key={idx}
          className="relative flex-shrink-0 w-48 h-64 rounded-lg overflow-hidden group"
        >
          {char.image_url ? (
            <img
              src={char.image_url}
              alt={char.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 rounded-lg animate-pulse"></div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 h-1/3">
            <h3 className="text-white text-lg font-bold mb-1">
              {char.name}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-2 opacity-90">
              {char.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}