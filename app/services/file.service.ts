import type { AxiosProgressEvent } from "axios";
import type { ReturnEvidenceType } from "@/app/types/return.types";
import { apiJava } from "@/lib/axios";
import { FileControlDetailType, FileControlType } from "../types/file.schema";

export interface TmpUploadResponse {
  url: string;
  publicId?: string | null;
}

export interface TmpUploadOptions {
  mediaType?: ReturnEvidenceType;
  timeoutMs?: number;
  onUploadProgress?: (event: AxiosProgressEvent) => void;
}

export class FileService {
  private static readonly PREFIX = "/files";

  static async tmpUpload(
    body: FormData,
    options?: TmpUploadOptions,
  ): Promise<TmpUploadResponse> {
    const response = await apiJava.post<TmpUploadResponse>(
      `${this.PREFIX}/tmpUpload`,
      body,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: options?.mediaType ? { mediaType: options.mediaType } : undefined,
        timeout: options?.timeoutMs,
        onUploadProgress: options?.onUploadProgress,
      },
    );
    return response.data;
  }

  static async fileDownload(
    body: FileControlType,
  ): Promise<FileControlDetailType> {
    const response = await apiJava.post<FileControlDetailType>(
      `${this.PREFIX}/download`,
      body,
    );
    return response.data;
  }
}
