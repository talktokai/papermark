/**
 * Public-API error codes and the error type thrown with them.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. The code set is the conventional REST error vocabulary; only
 * "unprocessable_entity" is thrown in the published source
 * (lib/api/documents/validate-external-url.ts), and `ErrorCode` is otherwise
 * used as the type of the `error_code` field on API usage events
 * (lib/api/usage.ts).
 *
 * `statusCode` follows the same shape as TeamError / DocumentError in
 * lib/errorHandler.ts, so callers that read it keep working.
 */
export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable_entity"
  | "rate_limit_exceeded"
  | "internal_server_error";

export const ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable_entity: 422,
  rate_limit_exceeded: 429,
  internal_server_error: 500,
};

export class PapermarkApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "PapermarkApiError";
    this.code = code;
    this.statusCode = ERROR_CODE_TO_STATUS[code] ?? 500;
  }
}
