import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className='flex-1 max-w-2xl'>
      <div className='relative'>
        <Input
          type='text'
          placeholder='جستجو در میان هزاران محصول...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className='pr-10 h-11 bg-muted/50 border-muted-foreground/20 focus:bg-background'
        />
        <Button
          onClick={handleSearch}
          size='icon'
          variant='ghost'
          className='absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7'>
          <Search className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
