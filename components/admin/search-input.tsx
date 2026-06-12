"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("search", value);
        params.delete("page"); // Reset to first page on new search
      } else {
        params.delete("search");
      }
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="search-input" className="sr-only">
        {placeholder}
      </label>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id="search-input"
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
        disabled={isPending}
        aria-label={placeholder}
      />
    </div>
  );
}
