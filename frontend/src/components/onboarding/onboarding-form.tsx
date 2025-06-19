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
import { termOrder } from "@/lib/utils/types"
import { Input } from "../ui/input"
import { Plus, Trash2 } from "lucide-react"
import { isFormValid } from "@/lib/utils/helpers"
import { MajorMinorCombobox } from "./major-minor-combobox"

const formSchema = z.object({
  startTerm: z.string(),
  startYear: z.string(),
  endTerm: z.string(),
  endYear: z.string(),
  major: z.string(),
  minor: z.string().optional(),
  transferCredits: z.array(z.object({
    name: z.string().optional(),
    courseId: z.string().optional(),
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
      name: z.string().refine((val) => val.trim().length > 0, {
        message: "Course name is required",
      }),
      courseId: z.string().refine((val) => val.trim().length > 0, {
        message: "Course ID is required",
      }),
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

export type OnboardingFormValues = z.infer<typeof formSchema>;

export default function OnboardingForm() {

  const form = useForm <z.infer<typeof formSchema>> ({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transferCredits: [
        { name: "", courseId: "" }, // <- crucial for avoiding uncontrolled input
      ],
    }
  })

  function onSubmit(values:z.infer<typeof formSchema >) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start term..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select graduation term..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
                  <FormDescription>You can always change this later</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            const { fields, append, remove } = useFieldArray({
              control: form.control,
              name: "transferCredits",
            });

            return (
              <FormItem>
                <FormLabel>Transfer Credits</FormLabel>
                <FormDescription>
                  You can find this information in your unofficial transcript from Testudo
                </FormDescription>
                <FormControl>
                  <div className="border rounded-md bg-card p-2">
                    {/* Header Row */}
                    <div className="grid grid-cols-[1fr,1fr,2.5rem] pt-2 pl-3 gap-2 font-medium text-sm rounded-lg">
                      <div>Course Name</div>
                      <div>Course ID</div>
                    </div>

                    {/* Dynamic Rows */}
                    {fields.map((course, index) => (
                      <div key={course.id} className="grid grid-cols-[1fr,1fr,2.5rem] py-2 gap-2">
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
                          className="text-red-600 hover:text-red-800"
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
        <Button 
          type="submit"
          // disabled={!isFormValid(form.watch())}
        >
          Submit
        </Button>
      </form>
    </Form>
  )
}