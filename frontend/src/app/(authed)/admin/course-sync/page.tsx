"use client";

import { Button } from "@/components/ui/button";
import { useCourseApi } from "@/lib/api/planner/planner.client";
import { useUser } from "@clerk/nextjs";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const COMMON_DEPARTMENTS = [
  "CMSC",
  "MATH",
  "STAT",
  "ENGL",
  "COMM",
  "BMGT",
  "ECON",
  "PHYS",
  "CHEM",
  "BSCI",
  "HIST",
  "GVPT",
  "PSYC",
  "SOCY",
];

const hasAdminRole = (metadata: Record<string, unknown> | null | undefined) => {
  const role = metadata?.role?.toString().toUpperCase();
  const status = metadata?.status?.toString().toUpperCase();
  return role === "ADMIN" || status === "ADMIN" || metadata?.isAdmin === true;
};

export default function CourseSyncPage() {
  const { user, isLoaded } = useUser();
  const { syncCourseDepartments } = useCourseApi();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([
    "CMSC",
    "MATH",
    "STAT",
  ]);
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState<{
    syncedDepartments: string[];
    coursesInsertedOrUpdated: number;
    errors: string[];
  } | null>(null);

  const isAdmin = useMemo(
    () =>
      hasAdminRole(user?.publicMetadata) ||
      hasAdminRole(user?.unsafeMetadata),
    [user],
  );

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((current) =>
      current.includes(department)
        ? current.filter((selected) => selected !== department)
        : [...current, department],
    );
  };

  const syncDepartments = async () => {
    if (selectedDepartments.length === 0) {
      toast.error("Select at least one department");
      return;
    }

    setSyncing(true);
    setSummary(null);
    const response = await syncCourseDepartments(selectedDepartments);
    setSyncing(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    setSummary(response.data);
    toast.success("Course sync finished");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-8">
        <h1 className="text-2xl font-semibold">Course Sync</h1>
        <p className="text-sm text-muted-foreground">
          Admin access is required.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Course Sync</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull course data from UMD.io into the local courses table.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMMON_DEPARTMENTS.map((department) => (
          <label
            key={department}
            className="flex h-11 items-center gap-3 border border-border bg-card px-3 text-sm"
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={selectedDepartments.includes(department)}
              onChange={() => toggleDepartment(department)}
            />
            <span className="font-medium">{department}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={syncDepartments} disabled={syncing}>
          {syncing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Sync Selected Departments
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedDepartments.length} selected
        </span>
      </div>

      {summary && (
        <div className="border border-border bg-card p-4 text-sm">
          <p>
            Synced {summary.syncedDepartments.join(", ") || "no departments"}.
          </p>
          <p className="mt-1 text-muted-foreground">
            {summary.coursesInsertedOrUpdated} courses inserted or updated.
          </p>
          {summary.errors.length > 0 && (
            <div className="mt-3 text-red-500">
              {summary.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
