"use client";

import * as z from "zod";
import axios from "axios";
import { QuestionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileText, PlusCircle, Trash } from "lucide-react";

import { MathText } from "@/components/math-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BankQuestion = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  defaultMarks: number;
  negativeMarks: number;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    position: number;
  }[];
};

type ContestQuestion = {
  id: string;
  position: number;
  marks: number | null;
  question: BankQuestion;
};

type ParsedQuestionDraft = {
  questionText: string;
  questionType: QuestionType;
  defaultMarks: number;
  negativeMarks?: number;
  explanation?: string;
  options: {
    optionText: string;
    isCorrect: boolean;
  }[];
};

interface ContestQuestionsManagerProps {
  contestId: string;
  contestQuestions: ContestQuestion[];
  questionBank: BankQuestion[];
}

const questionSchema = z.object({
  questionText: z.string().min(1, "Question is required"),
  questionType: z.nativeEnum(QuestionType),
  defaultMarks: z.coerce.number().min(0.5, "Marks are required"),
  negativeMarks: z.coerce.number().min(0).optional(),
  explanation: z.string().optional(),
});

const attachSchema = z.object({
  questionId: z.string().min(1, "Choose a question"),
  marks: z.string().optional(),
});

const defaultOptions = [
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
];

const latexExamples = [
  String.raw`\sqrt{8m(\frac{hc}{\lambda}-\phi)}/eB`,
  String.raw`2\sqrt{m(\frac{hc}{\lambda}-\phi)}/eB`,
  String.raw`K_{max}=h\nu-\phi`,
];

export const ContestQuestionsManager = ({
  contestId,
  contestQuestions,
  questionBank,
}: ContestQuestionsManagerProps) => {
  const router = useRouter();
  const [options, setOptions] = useState(defaultOptions);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [isSavingParsed, setIsSavingParsed] = useState(false);
  const isSavingParsedRef = useRef(false);

  const attachedIds = useMemo(
    () => new Set(contestQuestions.map((item) => item.question.id)),
    [contestQuestions]
  );

  const availableQuestions = questionBank.filter((question) => !attachedIds.has(question.id));

  const questionForm = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      questionType: QuestionType.SINGLE_CHOICE,
      defaultMarks: 1,
      negativeMarks: 0,
      explanation: "",
    },
  });

  const attachForm = useForm<z.infer<typeof attachSchema>>({
    resolver: zodResolver(attachSchema),
    defaultValues: {
      questionId: "",
      marks: "",
    },
  });

  const questionType = questionForm.watch("questionType");
  const needsOptions = questionType !== QuestionType.NUMERICAL;

  const onCreateQuestion = async (values: z.infer<typeof questionSchema>) => {
    try {
      await axios.post("/api/question-bank", {
        ...values,
        options: needsOptions ? options : [],
      });
      toast.success("Question added to bank");
      questionForm.reset();
      setOptions(defaultOptions);
      router.refresh();
    } catch {
      toast.error("Could not create question");
    }
  };

  const onParsePdf = async () => {
    if (!pdfFile) {
      toast.error("Choose a PDF first");
      return;
    }

    try {
      setIsParsingPdf(true);
      const formData = new FormData();
      formData.append("file", pdfFile);

      const response = await axios.post("/api/question-bank/parse-pdf", formData);
      setParsedQuestions(response.data.questions || []);
      toast.success("PDF parsed");
    } catch {
      toast.error("Could not parse PDF");
    } finally {
      setIsParsingPdf(false);
    }
  };

  const onSaveParsedQuestions = async () => {
    if (isSavingParsedRef.current || parsedQuestions.length === 0) return;

    try {
      isSavingParsedRef.current = true;
      setIsSavingParsed(true);

      await axios.post("/api/question-bank", {
        questions: parsedQuestions.map((question) => ({
          ...question,
          defaultMarks: question.defaultMarks || 1,
          negativeMarks: question.negativeMarks || 0,
        })),
      });

      toast.success("Questions saved to bank");
      setParsedQuestions([]);
      setPdfFile(null);
      router.refresh();
    } catch {
      toast.error("Could not save parsed questions");
    } finally {
      setIsSavingParsed(false);
      isSavingParsedRef.current = false;
    }
  };

  const onAttachQuestion = async (values: z.infer<typeof attachSchema>) => {
    try {
      await axios.post(`/api/contests/${contestId}/questions`, values);
      toast.success("Question attached");
      attachForm.reset();
      router.refresh();
    } catch {
      toast.error("Could not attach question");
    }
  };

  const onDetachQuestion = async (contestQuestionId: string) => {
    try {
      await axios.delete(`/api/contests/${contestId}/questions/${contestQuestionId}`);
      toast.success("Question removed");
      router.refresh();
    } catch {
      toast.error("Could not remove question");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-md border bg-slate-50 p-4 dark:bg-slate-900">
        <div className="mb-4">
          <h3 className="font-medium">Contest question set</h3>
          <p className="text-sm text-muted-foreground">
            Attach reusable questions to this contest.
          </p>
        </div>

        <Form {...attachForm}>
          <form
            onSubmit={attachForm.handleSubmit(onAttachQuestion)}
            className="grid gap-3 md:grid-cols-[1fr_140px_auto]"
          >
            <FormField
              control={attachForm.control}
              name="questionId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from question bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableQuestions.map((question) => (
                        <SelectItem key={question.id} value={question.id}>
                          {question.questionText.slice(0, 80)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={attachForm.control}
              name="marks"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Marks" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={availableQuestions.length === 0}>
              Attach
            </Button>
          </form>
        </Form>

        <div className="mt-5 space-y-3">
          {contestQuestions.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border bg-background p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {item.position}. {item.question.questionText}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.question.questionType.replace("_", " ")} ·{" "}
                  {item.marks ?? item.question.defaultMarks} marks
                </p>
                {item.question.options.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {item.question.options.map((option) => (
                      <div
                        key={option.id}
                        className="rounded-md border bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950"
                      >
                        <MathText value={option.optionText} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => onDetachQuestion(item.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {contestQuestions.length === 0 && (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No questions attached yet.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-background p-4">
        <div className="mb-4">
          <h3 className="font-medium">Import from PDF</h3>
          <p className="text-sm text-muted-foreground">
            Upload a question paper PDF. Formulas will be converted into LaTeX drafts.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            accept="application/pdf"
            type="file"
            onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onParsePdf}
            disabled={!pdfFile || isParsingPdf}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isParsingPdf ? "Parsing..." : "Parse PDF"}
          </Button>
        </div>

        {parsedQuestions.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                Parsed questions ({parsedQuestions.length})
              </p>
              <Button
                type="button"
                onClick={onSaveParsedQuestions}
                disabled={isSavingParsed}
              >
                {isSavingParsed ? "Saving..." : "Save all to bank"}
              </Button>
            </div>

            {parsedQuestions.map((question, questionIndex) => (
              <div key={questionIndex} className="rounded-md border p-3">
                <Textarea
                  className="min-h-[72px]"
                  value={question.questionText}
                  onChange={(event) =>
                    setParsedQuestions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === questionIndex
                          ? { ...item, questionText: event.target.value }
                          : item
                      )
                    )
                  }
                />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="rounded-md bg-slate-50 p-2 dark:bg-slate-950">
                      <div className="mb-2 flex items-center gap-2">
                        <Checkbox
                          checked={option.isCorrect}
                          onCheckedChange={(checked) =>
                            setParsedQuestions((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === questionIndex
                                  ? {
                                      ...item,
                                      options: item.options.map((optionItem, currentOptionIndex) =>
                                        currentOptionIndex === optionIndex
                                          ? { ...optionItem, isCorrect: checked === true }
                                          : optionItem
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          Correct
                        </span>
                      </div>
                      <Textarea
                        value={option.optionText}
                        onChange={(event) =>
                          setParsedQuestions((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === questionIndex
                                ? {
                                    ...item,
                                    options: item.options.map((optionItem, currentOptionIndex) =>
                                      currentOptionIndex === optionIndex
                                        ? { ...optionItem, optionText: event.target.value }
                                        : optionItem
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      {option.optionText.trim() && (
                        <div className="mt-2 rounded bg-background px-2 py-1 text-sm">
                          <MathText value={option.optionText} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {question.explanation && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {question.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background p-4">
        <div className="mb-4">
          <h3 className="font-medium">Create reusable question</h3>
          <p className="text-sm text-muted-foreground">
            Type formulas as LaTeX. The options below will render as math previews.
          </p>
        </div>

        <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
          <p className="font-medium">LaTeX examples</p>
          <div className="mt-2 grid gap-2">
            {latexExamples.map((example) => (
              <div key={example} className="grid gap-1 rounded bg-white/70 p-2 dark:bg-black/20">
                <code className="break-all text-xs">{example}</code>
                <MathText value={example} />
              </div>
            ))}
          </div>
        </div>

        <Form {...questionForm}>
          <form
            onSubmit={questionForm.handleSubmit(onCreateQuestion)}
            className="space-y-5"
          >
            <FormField
              control={questionForm.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write the question..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={questionForm.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(QuestionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="defaultMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks</FormLabel>
                    <FormControl>
                      <Input min={0.5} step={0.5} type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="negativeMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Negative marks</FormLabel>
                    <FormControl>
                      <Input step={0.25} type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {needsOptions && (
              <div className="space-y-3">
                <FormLabel>Options</FormLabel>
                {options.map((option, index) => (
                  <div key={index} className="grid gap-2 rounded-md border p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        className="mt-3"
                        checked={option.isCorrect}
                        onCheckedChange={(checked) =>
                          setOptions((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, isCorrect: checked === true }
                                : item
                            )
                          )
                        }
                      />
                      <Textarea
                        className="min-h-[72px]"
                        placeholder={`Option ${index + 1}, e.g. ${latexExamples[0]}`}
                        value={option.optionText}
                        onChange={(event) =>
                          setOptions((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, optionText: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    {option.optionText.trim() && (
                      <div className="rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950">
                        <span className="mr-2 text-xs font-medium text-muted-foreground">
                          Preview:
                        </span>
                        <MathText value={option.optionText} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <FormField
              control={questionForm.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional explanation..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Save question
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
