"use client";
import { toast } from "sonner";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Term,
  termOrder,
} from "@/lib/utils/types";
import { startDelayedLoadingToast } from "@/lib/delayed-loading-toast";
import { Input } from "../ui/input";
import { Plus, Trash2 } from "lucide-react";
import { MajorMinorCombobox } from "./major-minor-combobox";
import {
  submitOnboardingForm,
} from "@/lib/api/forms/onboarding-form.server";
import { useRouter } from "next/navigation";
import LoadingButton from "../ui/loading-button";

export type CsSpecializations =
  | "GENERAL"
  | "DATA_SCIENCE"
  | "QUANTUM"
  | "CYBERSECURITY"
  | "ML";

const csSpecializationOptions: { value: CsSpecializations; label: string }[] = [
  { value: "GENERAL", label: "General Track" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "QUANTUM", label: "Quantum Information" },
  { value: "CYBERSECURITY", label: "Cybersecurity" },
  { value: "ML", label: "Machine Learning" },
];

const completedCourseTermOrder: Record<string, number> = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
};

const baseOnboardingFormSchema = z
  .object({
    startTerm: z.string(),
    startYear: z.string(),
    endTerm: z.string(),
    endYear: z.string(),
    major: z.string(),
    csSpecialization: z.string().optional(),
    minor: z.string().optional(),
    transferCredits: z
      .array(
        z.object({
          name: z.string().optional(),
          courseId: z.string().optional(),
          genEds: z.string().optional(),
        }),
      )
      .optional()
      .transform((credits) => {
        // Filter out completely empty entries
        if (!credits) return undefined;
        const filtered = credits.filter(
          (credit) =>
            (credit.name && credit.name.trim()) ||
            (credit.courseId && credit.courseId.trim()),
        );
        return filtered.length > 0 ? filtered : undefined;
      })
      .pipe(
        z
          .array(
            z.object({
              name: z
                .string()
                .max(100, {
                  message: "Course name must be 100 characters or less",
                })
                .refine((val) => val.trim().length > 0, {
                  message: "Course name is required",
                }),
              courseId: z.string().refine((val) => val.trim().length > 0, {
                message: "Course ID is required",
              }),
              genEds: z.string().optional(),
            }),
          )
          .optional(),
      ),
    completedCourses: z
      .array(
        z.object({
          courseId: z.string().optional(),
          term: z.string().optional(),
          year: z.preprocess((val) => {
            if (typeof val === "number") return val.toString();
            return val;
          }, z.string().optional()),
        }),
      )
      .optional()
      .transform((courses) => {
        if (!courses) return undefined;
        const filtered = courses.filter(
          (course) =>
            (course.courseId && course.courseId.trim()) ||
            (course.term && course.term.trim()) ||
            (course.year && course.year.trim()),
        );
        return filtered.length > 0 ? filtered : undefined;
      })
      .pipe(
        z
          .array(
            z.object({
              courseId: z.string().refine((val) => val.trim().length > 0, {
                message: "Course ID is required",
              }),
              term: z
                .string()
                .refine(
                  (val) => ["SPRING", "SUMMER", "FALL", "WINTER"].includes(val),
                  {
                    message: "Term is required",
                  },
                ),
              year: z.string().refine((val) => /^\d{4}$/.test(val), {
                message: "Year is required",
              }),
            }),
          )
          .optional(),
      ),
  })
  .refine(
    (data) => {
      // Validate start and end terms and years
      if (data.startYear > data.endYear) return false;
      if (data.startYear === data.endYear) {
        // Compare term order in same year
        return (
          termOrder[data.startTerm as keyof typeof termOrder] <
          termOrder[data.endTerm as keyof typeof termOrder]
        );
      }
      return true;
    },
    {
      message: "Start semester must be before end semester",
      path: ["endTerm"],
    },
  )
  .refine(
    (data) => {
      // Validate start and end terms and years
      if (data.startYear > data.endYear) return false;
      if (data.startYear === data.endYear) {
        // Compare term order in same year
        return (
          termOrder[data.startTerm as keyof typeof termOrder] <
          termOrder[data.endTerm as keyof typeof termOrder]
        );
      }
      return true;
    },
    {
      message: "",
      path: ["endYear"],
    },
  )
  .refine(
    (data) => {
      // CS specialization is required if major is Computer Science
      if (data.major === "Computer Science" && !data.csSpecialization) {
        return false;
      }
      return true;
    },
    {
      message: "Computer Science specialization is required",
      path: ["csSpecialization"],
    },
  );

export type OnboardingFormValues = z.infer<typeof baseOnboardingFormSchema>;

export default function OnboardingForm({
  formInputs,
  backButton,
}: {
  formInputs?: OnboardingFormValues;
  backButton?: React.ReactNode;
}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof baseOnboardingFormSchema>>({
    resolver: zodResolver(baseOnboardingFormSchema),
    defaultValues: {
      transferCredits: [{ name: "", courseId: "", genEds: "" }],
      completedCourses: [],
      ...formInputs,
    },
  });

  const { isSubmitting } = form.formState;
  const watchedMajor = form.watch("major");

  async function onSubmit(values: z.infer<typeof baseOnboardingFormSchema>) {
    const dismissLoadingToast = startDelayedLoadingToast();
    try {
      form.clearErrors();
      const res = await submitOnboardingForm(values);
      if (res.fieldErrors) {
        for (const error of res.fieldErrors) {
          form.setError(error.path, { type: "server", message: error.message });
        }
      }
      if (!res.ok) {
        toast.error(
          res.message || "Failed to submit the form. Please try again",
        );
      } else {
        toast.success(res.message || "Onboarding form submitted successfully", {
          description: "You can always change this later in the settings",
          classNames: {
            title: "font-bold",
            description: "!text-muted-foreground font-semibold",
          },
        });
        router.push("/planner");
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    } finally {
      dismissLoadingToast();
    }
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "transferCredits",
  });

  const {
    fields: completedCourseFields,
    append: appendCompletedCourse,
    remove: removeCompletedCourse,
  } = useFieldArray({
    control: form.control,
    name: "completedCourses",
  });
  const completedCourseValues = useWatch({
    control: form.control,
    name: "completedCourses",
  });
  const completedCourseGroups = groupCompletedCoursesBySemester(
    completedCourseFields,
    completedCourseValues,
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-3xl mx-auto py-10 px-4"
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-6">
          <FormField
            control={form.control}
            name="startTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Start Semester{" "}
                  <span aria-hidden="true" className="text-red-600">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start term..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startYear"
            render={({ field }) => (
              <FormItem className="mt-auto">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 11 }).map((_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-6">
          <FormField
            control={form.control}
            name="endTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Graduation Semester{" "}
                  <span aria-hidden="true" className="text-red-600">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select graduation term..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endYear"
            render={({ field }) => (
              <FormItem className="mt-auto">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select graduation year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 11 }).map((_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="major"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Major{" "}
                <span aria-hidden="true" className="text-red-600">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </FormLabel>
              <MajorMinorCombobox
                type="major"
                value={field.value}
                setValueStateAction={field.onChange}
              />
              {/* {field.value !== "Computer Science" && (
                  <FormDescription><span className="font-bold">Note:</span> This site is designed with CS majors in mind (for now), all other majors can still use this site but some info might be inaccurate</FormDescription>
                )} */}
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedMajor === "Computer Science" && (
          <FormField
            control={form.control}
            name="csSpecialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Specialization{" "}
                  <span aria-hidden="true" className="text-red-600">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {csSpecializationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="minor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minor</FormLabel>
              <MajorMinorCombobox
                type="minor"
                value={field.value || ""}
                setValueStateAction={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transferCredits"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Transfer Credits</FormLabel>
                <FormDescription>
                  You can find this information in your unofficial transcript
                  from Testudo
                </FormDescription>
                <FormControl>
                  <div className="border rounded-md bg-card p-2">
                    {/* Header Row */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_2.5rem] pt-2 pl-3 gap-2 font-medium text-sm rounded-lg">
                      <div>Course Name</div>
                      <div>Course ID</div>
                      <div>Gen Eds</div>
                    </div>

                    {/* Dynamic Rows */}
                    {fields.map((course, index) => (
                      <div
                        key={course.id}
                        className="grid grid-cols-[1fr_1fr_1fr_2.5rem] py-2 gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={`transferCredits.${index}.name`}
                          render={({ field: nameField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="e.g. AP Psychology"
                                  {...nameField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`transferCredits.${index}.courseId`}
                          render={({ field: idField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="e.g. PSYC100"
                                  {...idField}
                                  className={idField.value ? "uppercase" : ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`transferCredits.${index}.genEds`}
                          render={({ field: genEds }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="e.g. DSHS" {...genEds} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={fields.length <= 1}
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800 h-10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Add New Row Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ name: "", courseId: "" })}
                      className="w-full "
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transfer Credit
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="completedCourses"
          render={() => (
            <FormItem>
              <FormLabel>Completed Courses</FormLabel>
              <FormControl>
                <div className="border rounded-md bg-card p-2">
                  {completedCourseFields.length === 0 && (
                    <div className="px-3 py-5 text-sm text-muted-foreground">
                      No completed or in-progress courses were found
                    </div>
                  )}

                  <div className="space-y-4">
                    {completedCourseGroups.map((group) => (
                      <div
                        key={group.key}
                        className="rounded-md border bg-background/50"
                      >
                        <div className="border-b px-3 py-2 text-sm font-medium">
                          {formatSemesterHeading(group.term, group.year)}
                        </div>
                        <div className="p-2">
                          {group.courses.map(({ field, index }) => (
                            <div
                              key={field.id}
                              className="grid grid-cols-[1fr_2.5rem] py-2 gap-2"
                            >
                              <FormField
                                control={form.control}
                                name={`completedCourses.${index}.courseId`}
                                render={({ field: courseIdField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. CMSC131"
                                        {...courseIdField}
                                        className={
                                          courseIdField.value ? "uppercase" : ""
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <input
                                type="hidden"
                                {...form.register(
                                  `completedCourses.${index}.term`,
                                )}
                              />
                              <input
                                type="hidden"
                                {...form.register(
                                  `completedCourses.${index}.year`,
                                )}
                              />

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCompletedCourse(index)}
                                className="text-red-600 hover:text-red-800 h-10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendCompletedCourse({
                        courseId: "",
                        term: "FALL",
                        year: new Date().getFullYear().toString(),
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Completed Course
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div
          className={`w-full flex -mt-3 ${backButton ? "justify-between" : "justify-end"}`}
        >
          {backButton ? backButton : null}
          <LoadingButton
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-4 w-30"
            loading={isSubmitting}
          >
            Submit
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}

type CompletedCourseField = {
  id: string;
  courseId?: string;
  term?: string;
  year?: string;
};

type CompletedCourseValue = NonNullable<
  OnboardingFormValues["completedCourses"]
>[number];

function groupCompletedCoursesBySemester(
  fields: CompletedCourseField[],
  values: CompletedCourseValue[] | undefined,
) {
  const groups = new Map<
    string,
    {
      key: string;
      term: string;
      year: string;
      sortYear: number;
      sortTerm: number;
      courses: { field: CompletedCourseField; index: number }[];
    }
  >();

  fields.forEach((field, index) => {
    const value = values?.[index];
    const term = (value?.term || field.term || "FALL").toUpperCase();
    const year = value?.year || field.year || "";
    const key = `${year}-${term}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        term,
        year,
        sortYear: Number(year) || Number.MAX_SAFE_INTEGER,
        sortTerm: completedCourseTermOrder[term] ?? Number.MAX_SAFE_INTEGER,
        courses: [],
      });
    }

    groups.get(key)?.courses.push({ field, index });
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.sortYear !== b.sortYear) return a.sortYear - b.sortYear;
    return a.sortTerm - b.sortTerm;
  });
}

function formatSemesterHeading(term: string, year: string) {
  const formattedTerm =
    term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
  return `${formattedTerm} ${year || ""}`.trim();
}

