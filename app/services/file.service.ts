import { apiJava } from "@/lib/axios";
import { FileControlDetailType, FileControlType } from "../types/file.schema";

export interface TmpUploadResponse {
  url: string;
  publicId?: string | null;
}

export class FileService {
  private static readonly PREFIX = "/files";

  static async tmpUpload(body: FormData): Promise<TmpUploadResponse> {
    const response = await apiJava.post<TmpUploadResponse>(
      `${this.PREFIX}/tmpUpload`,
      body,
      {
        headers: { 
          "Content-Type": "multipart/form-data" 
        },
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
