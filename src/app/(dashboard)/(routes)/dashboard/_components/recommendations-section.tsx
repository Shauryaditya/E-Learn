
"use client";

import { useState } from "react";
import axios from "axios";
import { Sparkles, Loader2, ExternalLink, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import toast from "react-hot-toast";

interface RecommendationsSectionProps {
  profile: {
      grade: string | null;
      board: string | null;
      subjects: string[];
      targetExam: string | null;
  };
}

export const RecommendationsSection = ({ profile }: RecommendationsSectionProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{
        resources: { title: string, type: string, url: string, description: string }[],
        tips: string[]
    } | null>(null);

    const onGenerate = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/gemini/recommendations", {
                grade: profile.grade,
                board: profile.board,
                subjects: profile.subjects,
                targetExam: profile.targetExam
            });
            setData(response.data);
            toast.success("Recommendations generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate recommendations");
        } finally {
            setLoading(false);
        }
    }

    if (!data && !loading) {
        return (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm">
                        <Sparkles className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sky-900">Personalize Your Learning</h3>
                        <p className="text-sm text-sky-700">
                            Get AI-curated web resources and a study routine based on your profile ({profile.grade}, {profile.board}).
                        </p>
                    </div>
                </div>
                <Button onClick={onGenerate} className="bg-sky-600 hover:bg-sky-700 text-white shadow-md">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Recommendations
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
             {loading && (
                <div className="flex flex-col items-center justify-center p-12 bg-muted border border-border rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-4" />
                    <p className="text-muted-foreground">Curating the best resources for you...</p>
                </div>
             )}

             {data && !loading && (
                 <>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sky-600" />
                        AI Recommended Resources & Tips
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Web Resources */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    Web Resources
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.resources.map((res, i) => (
                                    <div key={i} className="p-3 border rounded-lg hover:bg-muted/50 transition">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-sm text-primary">{res.title}</h4>
                                            <Badge variant="secondary" className="text-[10px]">{res.type}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{res.description}</p>
                                        <Link href={res.url} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400">
                                            Visit Resource <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Study Routine / Tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    Study Tips & Routine
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data.tips.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-foreground bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-3 rounded-md">
                                            <span className="font-bold text-amber-600 dark:text-amber-500">{i + 1}.</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setData(null)}>
                            Clear Recommendations
                        </Button>
                    </div>
                 </>
             )}
        </div>
    );
}
