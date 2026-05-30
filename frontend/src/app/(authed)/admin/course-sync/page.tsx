"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminRequirementsApi } from "@/lib/api/admin/requirements.client";
import { useCourseApi } from "@/lib/api/planner/planner.client";
import {
  CatalogProgram,
  CurriculumRequirementDetail,
  CurriculumRequirementSummary,
  RequirementProgramType,
  RequirementReviewStatus,
} from "@/lib/utils/types";
import { useUser } from "@clerk/nextjs";
import {
  CheckCircle2,
  DatabaseZap,
  FileJson2,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  "CPBE",
  "CPCV",
  "CPDJ",
  "CPET",
  "CPGH",
  "CPJT",
  "CPMS",
  "CPPL",
  "CPSA",
  "CPSF",
  "CPSG",
  "CPSN",
  "CPSP",
  "CPSS",
  "CRLN",
  "DANC",
  "DATA",
  "ECON",
  "EDCP",
  "EDHD",
  "EDHI",
  "EDSP",
  "EDUC",
  "EMBA",
  "ENAE",
  "ENAI",
  "ENBC",
  "ENCE",
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
  "ENPM",
  "ENRE",
  "ENSE",
  "ENSP",
  "ENST",
  "ENTM",
  "ENTS",
  "ENVH",
  "EPIB",
  "FGSM",
  "FIRE",
  "FMSC",
  "FREN",
  "GBHL",
  "GEMS",
  "GEOG",
  "GEOL",
  "GERS",
  "GFPL",
  "GLBC",
  "GREK",
  "GVPT",
  "HACS",
  "HBUS",
  "HDCC",
  "HEBR",
  "HESI",
  "HESP",
  "HGLO",
  "HHUM",
  "HISP",
  "HIST",
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
  "LATN",
  "LBSC",
  "LEAD",
  "LGBT",
  "LING",
  "MATH",
  "MEES",
  "MIEH",
  "MITH",
  "MLAW",
  "MLSC",
  "MSAI",
  "MSML",
  "MSQC",
  "MUED",
  "MUSC",
  "NACS",
  "NAVY",
  "NEUR",
  "NFSC",
  "NIAS",
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
  "SURV",
  "TDPS",
  "THET",
  "TLPL",
  "TLTC",
  "UMEI",
  "UNIV",
  "URSP",
  "USLT",
  "VIPS",
  "VMSC",
  "WEID",
  "WGSS",
];

const REMAINING_DEPARTMENTS = ALL_DEPARTMENTS.filter(
  (department) => !COMMON_DEPARTMENTS.includes(department),
);

const SYNC_ALL_DELAY_MS = 1000;
const PROGRAM_TYPES: RequirementProgramType[] = ["MAJOR", "MINOR"];
const RECORD_STATUS_OPTIONS: ("ALL" | RequirementReviewStatus)[] = [
  "ALL",
  "DRAFT",
  "APPROVED",
  "PARSE_ERROR",
];
const RECORD_TYPE_OPTIONS: ("ALL" | RequirementProgramType)[] = [
  "ALL",
  "MAJOR",
  "MINOR",
  "CERTIFICATE",
  "PROGRAM",
];

type DepartmentSyncStatus = "pending" | "syncing" | "synced" | "error";

type DepartmentSyncProgress = {
  status: DepartmentSyncStatus;
  coursesInsertedOrUpdated: number;
  message?: string;
};

const wait = (durationMs: number) =>
  new Promise((resolve) => window.setTimeout(resolve, durationMs));

const hasAdminRole = (metadata: Record<string, unknown> | null | undefined) => {
  const role = metadata?.role?.toString().toUpperCase();
  const status = metadata?.status?.toString().toUpperCase();
  return role === "ADMIN" || status === "ADMIN" || metadata?.isAdmin === true;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "Never";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const statusClassName = (status: RequirementReviewStatus) => {
  if (status === "APPROVED") {
    return "text-green-600 dark:text-green-400";
  }
  if (status === "PARSE_ERROR") {
    return "text-red-500";
  }
  return "text-amber-600 dark:text-amber-400";
};

export default function CourseSyncPage() {
  const { user, isLoaded } = useUser();
  const isAdmin = useMemo(
    () =>
      hasAdminRole(user?.publicMetadata) || hasAdminRole(user?.unsafeMetadata),
    [user],
  );

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
        <h1 className="text-2xl font-semibold">Admin Sync</h1>
        <p className="text-sm text-muted-foreground">
          Admin access is required.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin Sync</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Refresh course data and catalog requirement records.
        </p>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="courses">Course Sync</TabsTrigger>
          <TabsTrigger value="requirements">Requirements Sync</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-6">
          <CourseSyncPanel />
        </TabsContent>
        <TabsContent value="requirements" className="mt-6">
          <RequirementsSyncPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function CourseSyncPanel() {
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

  return (
    <div className="flex flex-col gap-6">
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
          {syncMode === "selected" ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DatabaseZap className="mr-2 h-4 w-4" />
          )}
          Sync Selected Departments
        </Button>
        <Button onClick={syncAllDepartments} disabled={syncing}>
          {syncMode === "all" ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
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
    </div>
  );
}

function RequirementsSyncPanel() {
  const {
    getCatalogPrograms,
    syncRequirements,
    getRequirementRecords,
    getRequirementRecord,
    updateRequirementRecord,
    approveRequirementRecord,
    resyncRequirementRecord,
  } = useAdminRequirementsApi();

  const [catalogPrograms, setCatalogPrograms] = useState<CatalogProgram[]>([]);
  const [programType, setProgramType] = useState<RequirementProgramType>("MAJOR");
  const [programQuery, setProgramQuery] = useState("");
  const [selectedProgramUrls, setSelectedProgramUrls] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [requirementsSyncing, setRequirementsSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    syncedPrograms: CurriculumRequirementSummary[];
    errors: string[];
  } | null>(null);
  const [records, setRecords] = useState<CurriculumRequirementSummary[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordType, setRecordType] = useState<"ALL" | RequirementProgramType>("ALL");
  const [recordStatus, setRecordStatus] = useState<"ALL" | RequirementReviewStatus>("ALL");
  const [recordQuery, setRecordQuery] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState<CurriculumRequirementDetail | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [rawDraft, setRawDraft] = useState("");
  const [jsonDraft, setJsonDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  const visiblePrograms = useMemo(() => {
    const query = programQuery.trim().toLowerCase();
    return catalogPrograms.filter((program) => {
      if (!query) {
        return true;
      }
      return (
        program.programName.toLowerCase().includes(query) ||
        program.catalogTitle.toLowerCase().includes(query)
      );
    });
  }, [catalogPrograms, programQuery]);

  const loadCatalogPrograms = async () => {
    setCatalogLoading(true);
    const response = await getCatalogPrograms([programType]);
    setCatalogLoading(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    setCatalogPrograms(response.data);
  };

  const loadRecords = async () => {
    setRecordsLoading(true);
    const response = await getRequirementRecords({
      type: recordType,
      status: recordStatus,
      query: recordQuery,
    });
    setRecordsLoading(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    setRecords(response.data);
  };

  useEffect(() => {
    void loadCatalogPrograms();
    setSelectedProgramUrls([]);
  }, [programType]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRecords();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [recordType, recordStatus, recordQuery]);

  const toggleProgram = (sourceUrl: string) => {
    setSelectedProgramUrls((current) =>
      current.includes(sourceUrl)
        ? current.filter((selectedUrl) => selectedUrl !== sourceUrl)
        : [...current, sourceUrl],
    );
  };

  const applyRequirementDetail = (record: CurriculumRequirementDetail) => {
    setSelectedRecord(record);
    setRawDraft(record.rawRequirementsText ?? "");
    setJsonDraft(JSON.stringify(record.structuredRequirements ?? {}, null, 2));
  };

  const loadRecordDetail = async (recordId: number) => {
    setRecordLoading(true);
    const response = await getRequirementRecord(recordId);
    setRecordLoading(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    applyRequirementDetail(response.data);
  };

  const syncSelectedRequirements = async () => {
    if (selectedProgramUrls.length === 0) {
      toast.error("Select at least one catalog program");
      return;
    }

    setRequirementsSyncing(true);
    setSyncSummary(null);
    const response = await syncRequirements({
      sourceUrls: selectedProgramUrls,
      maxPrograms: selectedProgramUrls.length,
    });
    setRequirementsSyncing(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    setSyncSummary(response.data);
    setSelectedProgramUrls([]);
    await loadRecords();
    toast.success("Requirements sync finished");
  };

  const saveDraft = async (showToast = true) => {
    if (!selectedRecord) {
      return false;
    }

    let structuredRequirements: unknown;
    try {
      structuredRequirements = JSON.parse(jsonDraft);
    } catch {
      toast.error("Structured requirements JSON is invalid");
      return false;
    }

    setSaving(true);
    const response = await updateRequirementRecord(selectedRecord.id, {
      programName: selectedRecord.programName,
      catalogTitle: selectedRecord.catalogTitle,
      rawRequirementsText: rawDraft,
      structuredRequirements,
      parseWarnings: selectedRecord.parseWarnings,
    });
    setSaving(false);

    if (!response.ok) {
      toast.error(response.message);
      return false;
    }

    applyRequirementDetail(response.data);
    await loadRecords();
    if (showToast) {
      toast.success("Requirement draft saved");
    }
    return true;
  };

  const approveSelectedRecord = async () => {
    if (!selectedRecord) {
      return;
    }

    const saved = await saveDraft(false);
    if (!saved) {
      return;
    }

    setApproving(true);
    const response = await approveRequirementRecord(selectedRecord.id);
    setApproving(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    applyRequirementDetail(response.data);
    await loadRecords();
    toast.success("Requirement record approved");
  };

  const resyncSelectedRecord = async () => {
    if (!selectedRecord) {
      return;
    }

    setResyncing(true);
    const response = await resyncRequirementRecord(selectedRecord.id);
    setResyncing(false);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    applyRequirementDetail(response.data);
    await loadRecords();
    toast.success("Requirement record re-synced");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
      <div className="flex flex-col gap-6">
        <section className="border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Catalog Programs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {catalogPrograms.length} {programType.toLowerCase()} records loaded
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadCatalogPrograms}
              disabled={catalogLoading || requirementsSyncing}
            >
              {catalogLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <select
              className="h-10 border border-input bg-background px-3 text-sm"
              value={programType}
              disabled={requirementsSyncing}
              onChange={(event) =>
                setProgramType(event.target.value as RequirementProgramType)
              }
            >
              {PROGRAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={programQuery}
                placeholder="Search catalog programs"
                onChange={(event) => setProgramQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={requirementsSyncing || visiblePrograms.length === 0}
              onClick={() =>
                setSelectedProgramUrls(visiblePrograms.map((program) => program.sourceUrl))
              }
            >
              Select Shown
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={requirementsSyncing}
              onClick={() => setSelectedProgramUrls([])}
            >
              Clear
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedProgramUrls.length} selected
            </span>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto border border-border">
            {catalogLoading ? (
              <div className="flex h-32 items-center justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : visiblePrograms.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No catalog programs found.</p>
            ) : (
              visiblePrograms.map((program) => (
                <CatalogProgramRow
                  key={program.sourceUrl}
                  program={program}
                  checked={selectedProgramUrls.includes(program.sourceUrl)}
                  disabled={requirementsSyncing}
                  onToggle={() => toggleProgram(program.sourceUrl)}
                />
              ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={syncSelectedRequirements} disabled={requirementsSyncing}>
              {requirementsSyncing ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DatabaseZap className="mr-2 h-4 w-4" />
              )}
              Sync Selected Requirements
            </Button>
          </div>

          {syncSummary && (
            <div className="mt-4 border border-border p-3 text-sm">
              <p>
                Synced {syncSummary.syncedPrograms.length} requirement records.
              </p>
              {syncSummary.errors.length > 0 && (
                <div className="mt-2 text-red-500">
                  {syncSummary.errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Saved Records</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {records.length} matching records
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadRecords}
              disabled={recordsLoading}
            >
              {recordsLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select
              className="h-10 border border-input bg-background px-3 text-sm"
              value={recordType}
              onChange={(event) =>
                setRecordType(event.target.value as "ALL" | RequirementProgramType)
              }
            >
              {RECORD_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="h-10 border border-input bg-background px-3 text-sm"
              value={recordStatus}
              onChange={(event) =>
                setRecordStatus(event.target.value as "ALL" | RequirementReviewStatus)
              }
            >
              {RECORD_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={recordQuery}
                placeholder="Search saved records"
                onChange={(event) => setRecordQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 max-h-96 overflow-y-auto border border-border">
            {recordsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No saved records found.</p>
            ) : (
              records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className="flex w-full flex-col gap-1 border-b border-border px-3 py-3 text-left transition hover:bg-muted/50"
                  onClick={() => loadRecordDetail(record.id)}
                >
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {record.catalogTitle}
                    <span className={statusClassName(record.status)}>
                      {record.status}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {record.programType} - Synced {formatDateTime(record.lastSyncedAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="min-h-[40rem] border border-border bg-card p-4">
        {recordLoading ? (
          <div className="flex h-full min-h-80 items-center justify-center">
            <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : selectedRecord ? (
          <RequirementEditor
            record={selectedRecord}
            rawDraft={rawDraft}
            jsonDraft={jsonDraft}
            saving={saving}
            approving={approving}
            resyncing={resyncing}
            onRawDraftChange={setRawDraft}
            onJsonDraftChange={setJsonDraft}
            onSaveDraft={() => saveDraft()}
            onApprove={approveSelectedRecord}
            onResync={resyncSelectedRecord}
          />
        ) : (
          <div className="flex h-full min-h-80 items-center justify-center text-sm text-muted-foreground">
            Select a saved requirement record.
          </div>
        )}
      </section>
    </div>
  );
}

function CatalogProgramRow({
  program,
  checked,
  disabled,
  onToggle,
}: {
  program: CatalogProgram;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border-b border-border px-3 py-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span className="min-w-0">
        <span className="block font-medium">{program.catalogTitle}</span>
        <span className="block break-all text-xs text-muted-foreground">
          {program.sourceUrl}
        </span>
      </span>
    </label>
  );
}

function RequirementEditor({
  record,
  rawDraft,
  jsonDraft,
  saving,
  approving,
  resyncing,
  onRawDraftChange,
  onJsonDraftChange,
  onSaveDraft,
  onApprove,
  onResync,
}: {
  record: CurriculumRequirementDetail;
  rawDraft: string;
  jsonDraft: string;
  saving: boolean;
  approving: boolean;
  resyncing: boolean;
  onRawDraftChange: (value: string) => void;
  onJsonDraftChange: (value: string) => void;
  onSaveDraft: () => void;
  onApprove: () => void;
  onResync: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold">{record.catalogTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {record.programType} - {record.catalogYear ?? "Catalog year unknown"} -{" "}
            <span className={statusClassName(record.status)}>{record.status}</span>
          </p>
          <a
            className="mt-1 block break-all text-xs text-primary underline-offset-4 hover:underline"
            href={record.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {record.sourceUrl}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onResync} disabled={resyncing}>
            {resyncing ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Resync
          </Button>
          <Button type="button" variant="outline" onClick={onSaveDraft} disabled={saving}>
            {saving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
          <Button type="button" onClick={onApprove} disabled={approving}>
            {approving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </div>
      </div>

      {record.parseWarnings.length > 0 && (
        <div className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          {record.parseWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <div className="grid flex-1 gap-4 xl:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileJson2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Structured JSON</h3>
          </div>
          <Textarea
            className="min-h-96 flex-1 resize-y font-mono text-xs"
            value={jsonDraft}
            spellCheck={false}
            onChange={(event) => onJsonDraftChange(event.target.value)}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <h3 className="text-sm font-medium">Source Text</h3>
          <Textarea
            className="min-h-96 flex-1 resize-y text-xs"
            value={rawDraft}
            spellCheck={false}
            onChange={(event) => onRawDraftChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
