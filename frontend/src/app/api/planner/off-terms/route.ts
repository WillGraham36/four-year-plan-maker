import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { createOffTerm, deleteOffTerm } from "@/server/services/user-service";
import { semesterSchema } from "@/server/validation/domain";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), request.json()]);
    await createOffTerm(userId, semesterSchema.parse(body));
    return ok("Created off term successfully");
  });
}

export async function DELETE(request: NextRequest) {
  return route(async () => {
    const userId = await requireUserId();
    const semester = semesterSchema.parse({
      term: request.nextUrl.searchParams.get("term"),
      year: z.coerce.number().parse(request.nextUrl.searchParams.get("year")),
    });
    await deleteOffTerm(userId, semester);
    return ok("Deleted off term successfully");
  });
}

