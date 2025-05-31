'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X as XIcon } from 'lucide-react';
import type { Tag } from '@/types';

interface TagInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Add tags..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTagName = inputValue.trim();
      if (newTagName && !value.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
        onChange([...value, { id: Date.now().toString(), name: newTagName }]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: Tag) => {
    onChange(value.filter(tag => tag.id !== tagToRemove.id));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <Badge key={tag.id} variant="secondary" className="py-1 px-2 text-sm">
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1.5 p-0.5 rounded-full hover:bg-muted-foreground/20"
              aria-label={`Remove ${tag.name}`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="text-sm"
      />
    </div>
  );
}
