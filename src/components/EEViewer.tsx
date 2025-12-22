/**
 * E&E Viewer Component
 * 
 * Displays Examples & Explanations content in an interactive format
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    BookOpen,
    ChevronDown,
    Scale,
    AlertTriangle,
    Lightbulb,
    Link2,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Sparkles,
    GraduationCap
} from "lucide-react";
import { EEContentData, EEExample } from "@/services/ee";

interface EEViewerProps {
    content: EEContentData;
    onGoDeeper?: () => void;
    onClose?: () => void;
}

const DIFFICULTY_STYLES = {
    basic: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Basic' },
    intermediate: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Intermediate' },
    advanced: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Advanced' }
};

export const EEViewer = ({ content, onGoDeeper, onClose }: EEViewerProps) => {
    const [expandedExample, setExpandedExample] = useState<number | null>(0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                            {content.sectionId}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700">E&E</Badge>
                    </div>
                    <h2 className="text-2xl font-bold">{content.topic}</h2>
                    <p className="text-muted-foreground text-sm">
                        Pages {content.sourcePages.join(', ')}
                    </p>
                </div>
                {onClose && (
                    <Button variant="outline" onClick={onClose}>Close</Button>
                )}
            </div>

            {/* The Rule */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Scale className="h-5 w-5" />
                        The Rule
                    </CardTitle>
                    <CardDescription>{content.rule.statutoryBasis}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg font-medium">{content.rule.statement}</p>

                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Key Requirements:</h4>
                        <ul className="space-y-1">
                            {content.rule.keyRequirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span>{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Examples */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Examples
                    </CardTitle>
                    <CardDescription>
                        Work through these {content.examples.length} examples from basic to advanced
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {content.examples.map((example, idx) => (
                        <ExampleCard
                            key={idx}
                            example={example}
                            isExpanded={expandedExample === idx}
                            onToggle={() => setExpandedExample(expandedExample === idx ? null : idx)}
                        />
                    ))}

                    {/* Go Deeper Button */}
                    {onGoDeeper && (
                        <Button
                            variant="outline"
                            className="w-full mt-4 border-dashed"
                            onClick={onGoDeeper}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Go Deeper — Generate More Examples
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Common Mistakes & Exam Tips */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Common Mistakes */}
                <Card className="border-red-200 dark:border-red-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg">
                            <XCircle className="h-5 w-5" />
                            Common Mistakes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {content.commonMistakes.map((mistake, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>{mistake}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Exam Tips */}
                <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-lg">
                            <Lightbulb className="h-5 w-5" />
                            Exam Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {content.examTips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <GraduationCap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Related Topics */}
            {content.relatedTopics.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Link2 className="h-5 w-5" />
                            Related Topics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {content.relatedTopics.map((topic, i) => (
                                <Badge
                                    key={i}
                                    variant="outline"
                                    className="py-2 px-3 cursor-pointer hover:bg-muted"
                                >
                                    <span className="font-semibold mr-2">{topic.sectionId}</span>
                                    <span className="text-muted-foreground">{topic.title}</span>
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// Example Card Sub-component
const ExampleCard = ({
    example,
    isExpanded,
    onToggle
}: {
    example: EEExample;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    const style = DIFFICULTY_STYLES[example.difficulty];

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger className="w-full">
                <div className={`flex items-center justify-between p-4 rounded-lg border ${isExpanded ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${style.bg} ${style.text}`}>
                            {example.number}
                        </div>
                        <div className="text-left">
                            <p className="font-medium">{example.title}</p>
                            <p className="text-xs text-muted-foreground">{example.facts.slice(0, 60)}...</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`${style.bg} ${style.text} border-0`}>
                            {style.label}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="p-4 space-y-4 border-x border-b rounded-b-lg">
                    {/* Facts */}
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">FACTS:</h4>
                        <p>{example.facts}</p>
                    </div>

                    {/* Question */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">QUESTION:</h4>
                        <p className="font-medium">{example.question}</p>
                    </div>

                    {/* Analysis */}
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">ANALYSIS:</h4>
                        <div className="space-y-3">
                            {example.analysis.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                        {step.step}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{step.issue}</p>
                                        <p className="text-sm text-muted-foreground">{step.analysis}</p>
                                        <p className="text-sm font-medium text-primary">{step.conclusion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Result */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-1">RESULT:</h4>
                        <p>{example.result}</p>
                    </div>

                    {/* Key Takeaway */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-300 mb-1">💡 KEY TAKEAWAY:</h4>
                        <p className="italic">{example.keyTakeaway}</p>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default EEViewer;
