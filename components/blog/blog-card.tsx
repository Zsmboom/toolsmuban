"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { BlogPostMeta } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPostMeta;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <Card
        className={cn(
          "h-full overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer",
          featured && "md:grid md:grid-cols-2 md:gap-6"
        )}
      >
        {/* Image */}
        {post.image && (
          <div className={cn(
            "relative overflow-hidden bg-muted",
            featured ? "h-full min-h-[300px]" : "h-48"
          )}>
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading={featured ? "eager" : "lazy"}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 p-6">
          {/* Category & Reading Time */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-medium">
              {post.category}
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-bold leading-tight transition-colors group-hover:text-primary",
              featured ? "text-2xl md:text-3xl" : "text-xl"
            )}
          >
            {post.title}
          </h3>

          {/* Description */}
          <p
            className={cn(
              "text-muted-foreground line-clamp-2",
              featured && "text-lg line-clamp-3"
            )}
          >
            {post.description}
          </p>

          {/* Meta */}
          <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
