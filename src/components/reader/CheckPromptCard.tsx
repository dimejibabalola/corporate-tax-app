/**
 * CheckPromptCard Component
 * 
 * Non-graded recall prompts embedded in reading
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckPrompt } from '@/types/reader';
import { HelpCircle, CheckCircle, RotateCcw, Lightbulb } from 'lucide-react';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface CheckPromptCardProps {
    prompt: CheckPrompt;
    userId: string;
    onResponse?: (action: 'got_it' | 'need_review') => void;
}

export const CheckPromptCard = ({ prompt, userId, onResponse }: CheckPromptCardProps) => {
    const [revealed, setRevealed] = useState(false);
    const [responded, setResponded] = useState(false);

    const handleReveal = async () => {
        setRevealed(true);

        // Log the reveal
        await db.checkPromptResponses.add({
            id: uuidv4(),
            userId,
            promptId: prompt.id,
            sectionId: prompt.sectionId,
            action: 'revealed',
            respondedAt: new Date()
        });
    };

    const handleResponse = async (action: 'got_it' | 'need_review') => {
        setResponded(true);

        // Log the response
        await db.checkPromptResponses.add({
            id: uuidv4(),
            userId,
            promptId: prompt.id,
            sectionId: prompt.sectionId,
            action,
            respondedAt: new Date()
        });

        onResponse?.(action);
    };

    return (
        <Card className="my-6 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                        <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                            🤔 Check yourself:
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {prompt.prompt}
                        </p>

                        {prompt.hint && !revealed && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                                <Lightbulb className="w-4 h-4" />
                                Hint: {prompt.hint}
                            </p>
                        )}

                        {!revealed ? (
                            <Button
                                variant="outline"
                                className="border-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                                onClick={handleReveal}
                            >
                                Reveal Answer
                            </Button>
                        ) : (
                            <>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-4">
                                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">✓ Answer:</p>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                        {prompt.answer}
                                    </p>
                                </div>

                                {!responded ? (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                                            onClick={() => handleResponse('got_it')}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                            Got it
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                            onClick={() => handleResponse('need_review')}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2 text-amber-600" />
                                            Need to review
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Response recorded!
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                    💡 These don't count toward your score — just checking comprehension before moving on.
                </p>
            </CardContent>
        </Card>
    );
};

export default CheckPromptCard;