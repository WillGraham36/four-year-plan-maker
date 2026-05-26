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

const ALL_DEPARTMENTS = [
  "AAAS",
  "AAPS",
  "AASP",
  "AAST",
  "ABRM",
  "AGNR",
  "AGST",
  "AMSC",
  "AMST",
  "ANSC",
  "ANTH",
  "AOSC",
  "ARAB",
  "ARCH",
  "AREC",
  "ARHU",
  "ARMY",
  "ARSC",
  "ARTH",
  "ARTT",
  "ASTR",
  "BCHM",
  "BDBA",
  "BEES",
  "BIOE",
  "BIOI",
  "BIOL",
  "BIOM",
  "BIPH",
  "BISI",
  "BMGT",
  "BMIN",
  "BMSO",
  "BSCI",
  "BSCV",
  "BSGC",
  "BSOS",
  "BSST",
  "BUAC",
  "BUDT",
  "BUFN",
  "BULM",
  "BUMK",
  "BUMO",
  "BUSI",
  "BUSM",
  "BUSO",
  "CBMG",
  "CCJS",
  "CHBE",
  "CHEM",
  "CHIN",
  "CHPH",
  "CHSE",
  "CINE",
  "CLAS",
  "CLFS",
  "CMLT",
  "CMNS",
  "CMSC",
  "COMM",
  "CONS",
  "CPBE",
  "CPCV",
  "CPDJ",
  "CPET",
  "CPGH",
  "CPJT",
  "CPMS",
  "CPPL",
  "CPSA",
  "CPSD",
  "CPSF",
  "CPSG",
  "CPSN",
  "CPSP",
  "CPSS",
  "CRLN",
  "DANC",
  "DATA",
  "EALL",
  "ECON",
  "EDCI",
  "EDCP",
  "EDDI",
  "EDHD",
  "EDHI",
  "EDMS",
  "EDPS",
  "EDSP",
  "EDUC",
  "EMBA",
  "ENAE",
  "ENAI",
  "ENBC",
  "ENCE",
  "ENCH",
  "ENCO",
  "ENEB",
  "ENED",
  "ENEE",
  "ENES",
  "ENFP",
  "ENGL",
  "ENMA",
  "ENME",
  "ENMT",
  "ENNU",
  "ENPM",
  "ENPP",
  "ENRE",
  "ENSE",
  "ENSP",
  "ENST",
  "ENTE",
  "ENTM",
  "ENTS",
  "ENVH",
  "EPIB",
  "EXST",
  "FGSM",
  "FILM",
  "FIRE",
  "FMSC",
  "FREN",
  "GBHL",
  "GEMS",
  "GEOG",
  "GEOL",
  "GERM",
  "GERS",
  "GFPL",
  "GLBC",
  "GREK",
  "GVPT",
  "HACS",
  "HBUS",
  "HDCC",
  "HEBR",
  "HEIP",
  "HESI",
  "HESP",
  "HGLO",
  "HHUM",
  "HISP",
  "HIST",
  "HLMN",
  "HLSA",
  "HLSC",
  "HLTH",
  "HNUH",
  "HONR",
  "IDEA",
  "IMDM",
  "IMMR",
  "INAG",
  "INFM",
  "INST",
  "ISRL",
  "ITAL",
  "JAPN",
  "JOUR",
  "JWST",
  "KNES",
  "KORA",
  "LACS",
  "LARC",
  "LASC",
  "LATN",
  "LBSC",
  "LEAD",
  "LGBT",
  "LING",
  "MAIT",
  "MATH",
  "MEES",
  "MIEH",
  "MITH",
  "MLAW",
  "MLSC",
  "MOCB",
  "MSAI",
  "MSBB",
  "MSMC",
  "MSML",
  "MSQC",
  "MUED",
  "MUSC",
  "MUSP",
  "NACS",
  "NAVY",
  "NEUR",
  "NFSC",
  "NIAP",
  "NIAS",
  "NIAV",
  "OURS",
  "PEER",
  "PERS",
  "PHIL",
  "PHPE",
  "PHSC",
  "PHYS",
  "PLCY",
  "PLSC",
  "PORT",
  "PSYC",
  "QMMS",
  "RDEV",
  "RELS",
  "RUSS",
  "SDSB",
  "SDSI",
  "SLAA",
  "SLLC",
  "SMLP",
  "SOCY",
  "SPAN",
  "SPHL",
  "STAT",
  "SUMM",
  "SURV",
  "TDPS",
  "THET",
  "TLPL",
  "TLTC",
  "TOXI",
  "UGST",
  "UMEI",
  "UNIV",
  "URSP",
  "USLT",
  "VIPS",
  "VMSC",
  "WEID",
  "WGSS",
  "WMST",
  "XPER",
];

const REMAINING_DEPARTMENTS = ALL_DEPARTMENTS.filter(
  (department) => !COMMON_DEPARTMENTS.includes(department),
);

type DepartmentSyncStatus = "pending" | "syncing" | "synced" | "error";

type DepartmentSyncProgress = {
  status: DepartmentSyncStatus;
  coursesInsertedOrUpdated: number;
  message?: string;
};

const SYNC_ALL_DELAY_MS = 1000;

const wait = (durationMs: number) =>
  new Promise((resolve) => window.setTimeout(resolve, durationMs));

const hasAdminRole = (metadata: Record<string, unknown> | null | undefined) => {
  const role = metadata?.role?.toString().toUpperCase();
  const status = metadata?.status?.toString().toUpperCase();
  return role === "ADMIN" || status === "ADMIN" || metadata?.isAdmin === true;
};

export default function CourseSyncPage() {
  const { user, isLoaded } = useUser();
  const { syncCourseDepartments } = useCourseApi();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMode, setSyncMode] = useState<"selected" | "all" | null>(null);
  const [progress, setProgress] = useState<
    Record<string, DepartmentSyncProgress>
  >({});
  const [summary, setSummary] = useState<{
    syncedDepartments: string[];
    coursesInsertedOrUpdated: number;
    errors: string[];
  } | null>(null);

  const isAdmin = useMemo(
    () =>
      hasAdminRole(user?.publicMetadata) || hasAdminRole(user?.unsafeMetadata),
    [user],
  );

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((current) =>
      current.includes(department)
        ? current.filter((selected) => selected !== department)
        : [...current, department],
    );
  };

  const updateDepartmentProgress = (
    department: string,
    nextProgress: DepartmentSyncProgress,
  ) => {
    setProgress((current) => ({
      ...current,
      [department]: nextProgress,
    }));
  };

  const syncDepartments = async () => {
    if (selectedDepartments.length === 0) {
      toast.error("Select at least one department");
      return;
    }

    setSyncing(true);
    setSyncMode("selected");
    setProgress({});
    setSummary(null);
    const response = await syncCourseDepartments(selectedDepartments);
    setSyncing(false);
    setSyncMode(null);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    setSummary(response.data);
    toast.success("Course sync finished");
  };

  const syncAllDepartments = async () => {
    setSyncing(true);
    setSyncMode("all");
    setSummary(null);
    setProgress(
      Object.fromEntries(
        ALL_DEPARTMENTS.map((department) => [
          department,
          { status: "pending", coursesInsertedOrUpdated: 0 },
        ]),
      ),
    );

    const syncedDepartments: string[] = [];
    const errors: string[] = [];
    let coursesInsertedOrUpdated = 0;

    for (let i = 0; i < ALL_DEPARTMENTS.length; i++) {
      const department = ALL_DEPARTMENTS[i];
      updateDepartmentProgress(department, {
        status: "syncing",
        coursesInsertedOrUpdated: 0,
      });

      const response = await syncCourseDepartments([department]);

      if (response.ok) {
        const departmentErrors = response.data.errors;
        const wasSynced = response.data.syncedDepartments.includes(department);
        coursesInsertedOrUpdated += response.data.coursesInsertedOrUpdated;

        if (wasSynced) {
          syncedDepartments.push(department);
        }

        if (departmentErrors.length > 0) {
          errors.push(...departmentErrors);
        }

        updateDepartmentProgress(department, {
          status: departmentErrors.length > 0 ? "error" : "synced",
          coursesInsertedOrUpdated: response.data.coursesInsertedOrUpdated,
          message: departmentErrors.join(", "),
        });
      } else {
        const message = `${department}: ${response.message}`;
        errors.push(message);
        updateDepartmentProgress(department, {
          status: "error",
          coursesInsertedOrUpdated: 0,
          message,
        });
      }

      setSummary({
        syncedDepartments,
        coursesInsertedOrUpdated,
        errors,
      });

      if (i < ALL_DEPARTMENTS.length - 1) {
        await wait(SYNC_ALL_DELAY_MS);
      }
    }

    setSyncing(false);
    setSyncMode(null);
    toast.success("All department sync finished");
  };

  const completedProgressCount = Object.values(progress).filter(
    (department) =>
      department.status === "synced" || department.status === "error",
  ).length;

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
              disabled={syncing}
              onChange={() => toggleDepartment(department)}
            />
            <span className="font-medium">{department}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedDepartments(ALL_DEPARTMENTS)}
            disabled={syncing}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedDepartments([])}
            disabled={syncing}
          >
            Clear
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedDepartments.length} selected
          </span>
        </div>

        <div>
          <h2 className="text-sm font-medium">All Departments</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {REMAINING_DEPARTMENTS.map((department) => (
              <label
                key={department}
                className="flex h-9 items-center gap-2 border border-border bg-card px-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedDepartments.includes(department)}
                  disabled={syncing}
                  onChange={() => toggleDepartment(department)}
                />
                <span className="font-medium">{department}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={syncDepartments} disabled={syncing}>
          {syncMode === "selected" && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sync Selected Departments
        </Button>
        <Button onClick={syncAllDepartments} disabled={syncing}>
          {syncMode === "all" && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sync All Departments
        </Button>
      </div>

      {syncMode === "all" && (
        <div className="border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">
              Syncing {completedProgressCount} of {ALL_DEPARTMENTS.length}
            </p>
            <p className="text-muted-foreground">
              {summary?.coursesInsertedOrUpdated ?? 0} courses updated
            </p>
          </div>
          <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {ALL_DEPARTMENTS.map((department) => {
              const departmentProgress = progress[department];
              const status = departmentProgress?.status ?? "pending";

              return (
                <div
                  key={department}
                  className="flex min-h-10 items-center justify-between gap-3 border border-border px-3 py-2"
                >
                  <span className="font-medium">{department}</span>
                  <span
                    className={
                      status === "error"
                        ? "text-red-500"
                        : status === "synced"
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                    }
                  >
                    {status === "syncing" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : status === "synced" ? (
                      `${departmentProgress.coursesInsertedOrUpdated} courses`
                    ) : (
                      status
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
