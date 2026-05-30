"use client";

import { useFetchWithAuth } from "@/hooks/useFetchWithAuthClient";
import {
  CatalogProgramListSchema,
  CurriculumRequirementDetailSchema,
  CurriculumRequirementSummaryListSchema,
  CurriculumRequirementSyncSummarySchema,
} from "@/lib/utils/schemas";
import {
  CatalogProgram,
  CurriculumRequirementDetail,
  CurriculumRequirementSummary,
  CurriculumRequirementSyncSummary,
  CustomServerResponse,
  RequirementProgramType,
  RequirementReviewStatus,
} from "@/lib/utils/types";

type RequirementRecordFilters = {
  type?: RequirementProgramType | "ALL";
  status?: RequirementReviewStatus | "ALL";
  query?: string;
};

type SyncRequirementsRequest = {
  programTypes?: RequirementProgramType[];
  programNames?: string[];
  sourceUrls?: string[];
  maxPrograms?: number;
};

export function useAdminRequirementsApi() {
  const { fetchWithAuth } = useFetchWithAuth();

  const getCatalogPrograms = async (
    types: RequirementProgramType[] = ["MAJOR", "MINOR"],
    query = "",
  ): Promise<CustomServerResponse<CatalogProgram[]>> => {
    const params = new URLSearchParams();
    types.forEach((type) => params.append("types", type));
    if (query.trim()) {
      params.set("q", query.trim());
    }

    const response = await fetchWithAuth("admin/requirements/catalog/programs", params);
    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Failed to load catalog programs",
        data: null,
      };
    }

    const parsedPrograms = CatalogProgramListSchema.safeParse(response.data);
    if (!parsedPrograms.success) {
      return {
        ok: false,
        message: "Unexpected catalog program response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Loaded catalog programs",
      data: parsedPrograms.data,
    };
  };

  const syncRequirements = async (
    request: SyncRequirementsRequest,
  ): Promise<CustomServerResponse<CurriculumRequirementSyncSummary>> => {
    const response = await fetchWithAuth("admin/requirements/sync", new URLSearchParams(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Failed to sync requirements",
        data: null,
      };
    }

    const parsedSummary = CurriculumRequirementSyncSummarySchema.safeParse(response.data);
    if (!parsedSummary.success) {
      return {
        ok: false,
        message: "Unexpected requirements sync response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Synced requirements",
      data: parsedSummary.data,
    };
  };

  const getRequirementRecords = async (
    filters: RequirementRecordFilters = {},
  ): Promise<CustomServerResponse<CurriculumRequirementSummary[]>> => {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== "ALL") {
      params.set("type", filters.type);
    }
    if (filters.status && filters.status !== "ALL") {
      params.set("status", filters.status);
    }
    if (filters.query?.trim()) {
      params.set("q", filters.query.trim());
    }

    const response = await fetchWithAuth("admin/requirements/records", params);
    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Failed to load requirement records",
        data: null,
      };
    }

    const parsedRecords = CurriculumRequirementSummaryListSchema.safeParse(response.data);
    if (!parsedRecords.success) {
      return {
        ok: false,
        message: "Unexpected requirement records response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Loaded requirement records",
      data: parsedRecords.data,
    };
  };

  const getRequirementRecord = async (
    id: number,
  ): Promise<CustomServerResponse<CurriculumRequirementDetail>> => {
    const response = await fetchWithAuth(`admin/requirements/records/${id}`);
    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Failed to load requirement record",
        data: null,
      };
    }

    const parsedRecord = CurriculumRequirementDetailSchema.safeParse(response.data);
    if (!parsedRecord.success) {
      return {
        ok: false,
        message: "Unexpected requirement detail response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Loaded requirement record",
      data: parsedRecord.data,
    };
  };

  const updateRequirementRecord = async (
    id: number,
    detail: Pick<
      CurriculumRequirementDetail,
      "programName" | "catalogTitle" | "rawRequirementsText" | "parseWarnings"
    > & { structuredRequirements: unknown },
  ): Promise<CustomServerResponse<CurriculumRequirementDetail>> => {
    const response = await fetchWithAuth(`admin/requirements/records/${id}`, new URLSearchParams(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(detail),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Failed to save requirement record",
        data: null,
      };
    }

    const parsedRecord = CurriculumRequirementDetailSchema.safeParse(response.data);
    if (!parsedRecord.success) {
      return {
        ok: false,
        message: "Unexpected requirement detail response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Saved requirement record",
      data: parsedRecord.data,
    };
  };

  const approveRequirementRecord = async (
    id: number,
  ): Promise<CustomServerResponse<CurriculumRequirementDetail>> => {
    return updateRecordWithEmptyPost(`admin/requirements/records/${id}/approve`);
  };

  const resyncRequirementRecord = async (
    id: number,
  ): Promise<CustomServerResponse<CurriculumRequirementDetail>> => {
    return updateRecordWithEmptyPost(`admin/requirements/records/${id}/resync`);
  };

  const updateRecordWithEmptyPost = async (
    route: string,
  ): Promise<CustomServerResponse<CurriculumRequirementDetail>> => {
    const response = await fetchWithAuth(route, new URLSearchParams(), {
      method: "POST",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Failed to update requirement record",
        data: null,
      };
    }

    const parsedRecord = CurriculumRequirementDetailSchema.safeParse(response.data);
    if (!parsedRecord.success) {
      return {
        ok: false,
        message: "Unexpected requirement detail response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Updated requirement record",
      data: parsedRecord.data,
    };
  };

  return {
    getCatalogPrograms,
    syncRequirements,
    getRequirementRecords,
    getRequirementRecord,
    updateRequirementRecord,
    approveRequirementRecord,
    resyncRequirementRecord,
  };
}
