import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Sparkles, Image, Video, ArrowUpRight } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Tools',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations('toolsPage');

  const tools = [
    {
      id: "image-generator",
      name: t('tools.imageGenerator.name', { defaultValue: 'AI Image Generator' }),
      description: t('tools.imageGenerator.description', { defaultValue: 'Create stunning images with AI' }),
      icon: Image,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: "video-editor",
      name: t('tools.videoEditor.name', { defaultValue: 'Video Editor' }),
      description: t('tools.videoEditor.description', { defaultValue: 'Edit videos with powerful tools' }),
      icon: Video,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: "text-enhancer",
      name: t('tools.textEnhancer.name', { defaultValue: 'Text Enhancer' }),
      description: t('tools.textEnhancer.description', { defaultValue: 'Improve your writing with AI' }),
      icon: Sparkles,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      id: "code-generator",
      name: t('tools.codeGenerator.name', { defaultValue: 'Code Generator' }),
      description: t('tools.codeGenerator.description', { defaultValue: 'Generate code snippets instantly' }),
      icon: Wrench,
      gradient: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Tools' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'Select a tool to get started' })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className="group p-6 border border-border/50 hover-lift hover:border-primary/30 transition-all duration-300 cursor-pointer"
            >
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${tool.gradient} p-3 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {tool.description}
              </p>
              <Button className="mt-4 w-full active:scale-95 transition-all duration-200 group-hover:shadow-md">
                {t('launchTool', { defaultValue: 'Launch Tool' })}
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
