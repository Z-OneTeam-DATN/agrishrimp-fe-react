import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const javaApiUrl = process.env.JAVA_API_URL ?? "http://api:8004/api";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authorization = request.headers.get("authorization");

  try {
    await axios.delete(`${javaApiUrl}/roles/${id}`, {
      headers: authorization
        ? {
            Authorization: authorization,
          }
        : undefined,
      validateStatus: () => true,
    }).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      throw {
        response: {
          status: response.status,
          data: response.data,
        },
      };
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    const status = error?.response?.status ?? 500;
    const data = error?.response?.data ?? {
      message: "Không thể xóa vai trò",
    };

    return NextResponse.json(data, { status });
  }
}
