"use client"
import {
  toast
} from "sonner"
import {
  useFieldArray,
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Course, CustomServerResponse, GenEd, termOrder } from "@/lib/utils/types"
import { Input } from "../ui/input"
import { Plus, Trash2 } from "lucide-react"
import { MajorMinorCombobox } from "./major-minor-combobox"
import { getMultipleCourseInfos } from "@/lib/api/planner/planner.server"
import { submitOnboardingForm, SubmitOnboardingFormProps } from "@/lib/api/forms/onboarding-form.server"
import { useRouter } from "next/navigation"
import LoadingButton from "../ui/loading-button"

const baseOnboardingFormSchema = z.object({
  startTerm: z.string(),
  startYear: z.string(),
  endTerm: z.string(),
  endYear: z.string(),
  major: z.string(),
  minor: z.string().optional(),
  transferCredits: z.array(z.object({
    name: z.string().optional(),
    courseId: z.string().optional(),
    genEds: z.string().optional(),
  }))
  .optional()
  .transform((credits) => {
    // Filter out completely empty entries
    if (!credits) return undefined;
    const filtered = credits.filter(credit => 
      (credit.name && credit.name.trim()) || (credit.courseId && credit.courseId.trim())
    );
    return filtered.length > 0 ? filtered : undefined;
  })
  .pipe(
    z.array(z.object({
      name: z.string().max(100, {
        message: "Course name must be 100 characters or less",
      }).refine((val) => val.trim().length > 0, {
        message: "Course name is required",
      }),
      courseId: z.string().refine((val) => val.trim().length > 0, {
        message: "Course ID is required",
      }),
      genEds: z.string().optional(),
    })).optional()
  ),
})
.refine((data) => {
  // Validate start and end terms and years
  if (data.startYear > data.endYear) return false;
  if (data.startYear === data.endYear) {
    // Compare term order in same year
    return termOrder[data.startTerm as keyof typeof termOrder] < termOrder[data.endTerm as keyof typeof termOrder];
  }
  return true;
}, {
  message: "Start semester must be before end semester",
  path: ["endTerm"],
})
.refine((data) => {
    // Validate start and end terms and years
    if (data.startYear > data.endYear) return false;
    if (data.startYear === data.endYear) {
      // Compare term order in same year
      return termOrder[data.startTerm as keyof typeof termOrder] < termOrder[data.endTerm as keyof typeof termOrder];
    }
    return true;
}, {
  message: "",
  path: ["endYear"],
});

export type OnboardingFormValues = z.infer<typeof baseOnboardingFormSchema>;

export default function OnboardingForm({ formInputs }: {formInputs?: OnboardingFormValues}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof baseOnboardingFormSchema>> ({
    resolver: zodResolver(baseOnboardingFormSchema),
    defaultValues: formInputs || {
      transferCredits: [
        { name: "", courseId: "", genEds: "" },
      ],
    }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values:z.infer<typeof baseOnboardingFormSchema >) {
    try {
      const errors: Record<number, string> = {};
      let coursesInfo: CustomServerResponse<Course[]> = { ok: true, message: "", data: [] };

      // If there are transfer credits, ensure they are trimmed and formatted correctly
      // Then validate
      const courseToGenEdMap: Record<string, string[][]> = {}
      if (values.transferCredits && values.transferCredits.length > 0) {
        values.transferCredits = values.transferCredits.map(credit => ({
          name: credit.name?.trim() || "",
          courseId: credit.courseId?.trim().toUpperCase() || "",
          genEds: credit.genEds?.trim().toUpperCase() || "",
        }));

        // Validate transfer credits
        values.transferCredits?.forEach((credit, index) => {
          if (!credit.name || !credit.courseId) {
            errors[index] = "Both course name and ID are required";
          } else if (!credit.courseId.match(/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/)) {
            errors[index] = `Invalid course ID format`;
          }

          // Convert genEds to format expected by backend, add them to map
          // Format: [["DSHS"], ["DSSP", "DSHU"]]
          let formattedGenEds = [[]] as string[][];
          if(credit.genEds && credit.genEds.length > 0) {
            formattedGenEds = credit.genEds
              .split("OR")
              .map(group =>
                group
                  .split(",")
                  .map(s => s.trim())
                  .filter(Boolean)
              )
              .filter(arr => arr.length > 0);
          }
          if (formattedGenEds.length > 0) {
            courseToGenEdMap[credit.courseId] = formattedGenEds;
          }
        });

        // If any errors, set them using setError from RHF
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([index, message]) => {
            form.setError(
              `transferCredits.${Number(index)}.courseId` as const,
              {
                type: "manual",
                message,
              }
            );
          });
          return;
        }

        if (!values.transferCredits || values.transferCredits.length === 0) { return;}
        const courseIds = values.transferCredits.map(credit => credit.courseId);
        coursesInfo = await getMultipleCourseInfos(courseIds);

        if (!coursesInfo.ok || !Array.isArray(coursesInfo.data)) {
          values.transferCredits.forEach((_, idx) => {
            form.setError(
              `transferCredits.${idx}.courseId` as const,
              {
                type: "manual",
                message: "Course could not be found",
              }
            );
          });
          return;
        } else {
          // coursesInfo.data should be an array of found course objects with courseId property
          const foundIds = new Set(coursesInfo.data.map((course: any) => course.courseId));
          values.transferCredits.forEach((credit, idx) => {
            if (!foundIds.has(credit.courseId)) {
              form.setError(
                `transferCredits.${idx}.courseId` as const,
                {
                  type: "manual",
                  message: "Course could not be found",
                }
              );
            }
            // If genEds were provided, validate against the course's genEds
            if (credit.genEds && courseToGenEdMap[credit.courseId]) {
              // Get genEds from backend course info
              const backendGenEds: string[][] = coursesInfo.data?.find((c: any) => c.courseId === credit.courseId)?.genEds || [];
              const userGenEds: string[][] = courseToGenEdMap[credit.courseId];

              // For each group in userGenEds, at least one value must be present in some group in backendGenEds
              const allValid = userGenEds.every(userGroup =>
              backendGenEds.some(backendGroup =>
                userGroup.every(userGenEd =>
                backendGroup.includes(userGenEd)
                )
              )
              );

              if (!allValid) {
              form.setError(
                `transferCredits.${idx}.genEds` as const,
                {
                type: "manual",
                message: "Gen Eds do not match any available options for this course",
                }
              );
              }
            }

          });
          // If any errors were set, stop submission
          if (Object.keys(form.formState.errors.transferCredits || {}).length > 0) {
            return;
          }
        }
      } else {
        // If no transfer credits, set to empty array
        values.transferCredits = [];
      }
      
      // All validation passed
      const submitValues: SubmitOnboardingFormProps = {
        ...values,
        startTerm: values.startTerm.toUpperCase(),
        endTerm: values.endTerm.toUpperCase(),
        transferCredits: values.transferCredits.map(credit => ({
          name: credit.name!,
          course: coursesInfo.data.find((course: any) => course.courseId === credit.courseId)!,
          semester: {
            term: "TRANSFER",
            year: -1,
          },
          genEdOverrides: courseToGenEdMap[credit.courseId] as GenEd[][] || [[]],
        })),
      }
      console.log(submitValues)

      const message = await submitOnboardingForm(submitValues);
      toast.success(message || "Onboarding form submitted successfully", {
        description: "You can always change this later in the settings",
        classNames: {
          title: "font-bold",
          description: "!text-muted-foreground font-semibold",
        }
      });
      router.push("/planner");
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "transferCredits",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Start Term{" "}
                  <span aria-hidden="true" className="text-red-600">*</span>
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
              <FormItem>
                  <FormLabel>
                  Start Year{" "}
                  <span aria-hidden="true" className="text-red-600">*</span>
                  <span className="sr-only">(required)</span>
                </FormLabel>
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="endTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Anticipated Graduation Term{" "}
                  <span aria-hidden="true" className="text-red-600">*</span>
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
                {!formInputs && (
                  <FormDescription>You can always change this later</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Anticipated Graduation Year{" "}
                  <span aria-hidden="true" className="text-red-600">*</span>
                  <span className="sr-only">(required)</span>
                </FormLabel>
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
                  <span aria-hidden="true" className="text-red-600">*</span>
                  <span className="sr-only">(required)</span>
                </FormLabel>
                <MajorMinorCombobox type="major" value={field.value} setValueStateAction={field.onChange} />
                {field.value !== "Computer Science" && (
                  <FormDescription><span className="font-bold">Note:</span> This site is designed with CS majors in mind (for now), all other majors can still use this site but some info might be inaccurate</FormDescription>
                )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="minor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minor</FormLabel>
              <MajorMinorCombobox type="minor" value={field.value || ""} setValueStateAction={field.onChange} />
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
                  You can find this information in your unofficial transcript from Testudo
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
                      <div key={course.id} className="grid grid-cols-[1fr_1fr_1fr_2.5rem] py-2 gap-2">
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
                                <Input
                                  placeholder="e.g. DSHS"
                                  {...genEds}
                                />
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
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transfer Credit
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <LoadingButton 
          type="submit"
          // disabled={!isFormValid(form.watch())}
          disabled={isSubmitting}
          className="flex items-center gap-4"
          loading={isSubmitting}
        >
          Submit
        </LoadingButton>
      </form>
    </Form>
  )
}