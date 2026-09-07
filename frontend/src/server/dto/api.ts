export type ApiResult<T> =
  | { ok: true; data: T; message?: string }
  | {
      ok: false;
      data: null;
      message: string;
      error: { code: string; message: string; details?: unknown };
    };

