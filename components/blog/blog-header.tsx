"use client";

import { Calendar, Clock, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface BlogHeaderProps {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  readingTime: string;
  image?: string;
}

export function BlogHeader({
  title,
  description,
  date,
  author,
  category,
  tags,
  readingTime,
  image,
}: BlogHeaderProps) {
  return (
    <header className="space-y-8">
      {/* Category */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm font-medium">
          {category}
        </Badge>
        <span className="text-sm text-muted-foreground">{readingTime}</span>
      </div>

      {/* Title */}
      <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
        {title}
      </h1>

      {/* Description */}
      <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
        {description}
      </p>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y py-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">{author}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <time dateTime={date}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{readingTime}</span>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Featured Image */}
      {image && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            className="object-cover"
            priority
          />
        </div>
      )}
    </header>
  );
}
