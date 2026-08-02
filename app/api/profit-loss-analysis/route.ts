import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/api-auth";

type ProfitLossAnalysisRequest = {
  branchName?: string;
  startDate?: string;
  endDate?: string;
  insightResult?: {
    cogsRatio?: number;
    cogsRatioStatus?: string;
    returnRatio?: number;
    returnRatioStatus?: string;
    netProfitChangePercent?: string;
    warnings?: string[];
    contributionBreakdown?: Array<{
      factor?: string;
      currentValue?: number;
      previousValue?: number;
      changeAmount?: number;
      note?: string;
    }>;
  };
};

// Backend trả về sentinel string thay vì bịa số khi không đủ mốc so sánh — diễn giải rõ bằng
// tiếng Việt ở đây để cả prompt gửi Gemini lẫn phần fallback đều không hiện chữ sentinel thô.
const describeNetProfitChange = (value?: string) => {
  if (value === "NO_PREVIOUS_DATA") {
    return "chưa có dữ liệu kỳ trước để so sánh";
  }
  if (value === "NEW_BASELINE") {
    return "lợi nhuận ròng kỳ trước bằng 0 nên mới phát sinh, không tính được % thay đổi";
  }
  return `${value ?? "0"}%`;
};

const buildFallbackResponse = (payload: ProfitLossAnalysisRequest) => {
  const insight = payload.insightResult;
  const warnings = insight?.warnings ?? [];
  const breakdown = insight?.contributionBreakdown ?? [];
  const topDrivers = breakdown
    .slice()
    .sort(
      (left, right) =>
        Math.abs(right?.changeAmount ?? 0) - Math.abs(left?.changeAmount ?? 0),
    )
    .slice(0, 3)
    .map((item) => {
      const label =
        item.factor === "REVENUE"
          ? "doanh thu goc"
          : item.factor === "COGS"
            ? "gia von"
            : item.factor === "SHIPPING"
              ? "phi ship rong"
              : item.factor === "DISCOUNT"
                ? "chiet khau rong"
                : "hang tra lai";
      const delta = Number(item.changeAmount ?? 0).toLocaleString("vi-VN");
      return `- ${label}: bien dong ${delta} VND`;
    })
    .join("\n");

  const summary = [
    `Bao cao lai lo cua ${payload.branchName || "he thong"} trong giai doan ${
      payload.startDate || "N/A"
    } den ${payload.endDate || "N/A"} cho thay ty le gia von/dat doanh thu thuan la ${
      insight?.cogsRatio ?? 0
    }% va ty le tra hang la ${insight?.returnRatio ?? 0}%.`,
    `Bien dong loi nhuan rong so voi ky truoc: ${describeNetProfitChange(insight?.netProfitChangePercent)}.`,
  ].join(" ");

  const keyDrivers = topDrivers || "Chua co du lieu dong gop bien dong ro rang.";
  const recommendation = warnings.length
    ? [
        "Uu tien xu ly cac canh bao hien tai:",
        ...warnings.map((warning) => `- ${warning}`),
        "- Ra soat nhom chi tieu bien dong manh nhat de xac dinh nguyen nhan goc.",
      ].join("\n")
    : "Duy tri bien loi nhuan hien tai, tiep tuc theo doi gia von, tra hang va hieu qua khuyen mai theo tung ky.";

  return {
    success: true,
    summary,
    keyDrivers,
    recommendation,
  };
};

export async function POST(request: Request) {
  if (!(await requireAuthenticatedSession())) {
    return NextResponse.json(
      { success: false, message: "Yêu cầu đăng nhập" },
      { status: 401 },
    );
  }

  try {
    const payload = (await request.json()) as ProfitLossAnalysisRequest;

    if (!payload?.insightResult) {
      return NextResponse.json(
        { success: false, message: "Missing profit-loss insight data" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(buildFallbackResponse(payload));
    }

    const prompt = `
Ban la chuyen gia phan tich tai chinh cho AgriShrimp.
Du lieu bao cao lai lo cua ${payload.branchName || "he thong"} tu ${
      payload.startDate || "N/A"
    } den ${payload.endDate || "N/A"}:
- Ty le gia von/doanh thu thuan: ${payload.insightResult.cogsRatio ?? 0}%
- Trang thai ty le gia von: ${payload.insightResult.cogsRatioStatus ?? "SAFE"}
- Ty le tra hang: ${payload.insightResult.returnRatio ?? 0}%
- Trang thai ty le tra hang: ${payload.insightResult.returnRatioStatus ?? "SAFE"}
- Bien dong loi nhuan rong so voi ky truoc: ${describeNetProfitChange(payload.insightResult.netProfitChangePercent)}
- Canh bao: ${
      payload.insightResult.warnings?.length
        ? payload.insightResult.warnings.join("; ")
        : "Khong co"
    }
- Dong gop bien dong:
${(payload.insightResult.contributionBreakdown ?? [])
  .map(
    (item) =>
      `  * ${item.factor}: current=${item.currentValue ?? 0}, previous=${
        item.previousValue ?? 0
      }, change=${item.changeAmount ?? 0}, note=${item.note ?? ""}`,
  )
  .join("\n")}

Hay tra ve JSON voi schema:
{
  "summary": "Tom tat ngan gon tinh hinh lai lo hien tai.",
  "keyDrivers": "Giai thich 2-3 nguyen nhan chinh gay bien dong, khong duoc bịa them so lieu.",
  "recommendation": "De xuat 3 hanh dong cu the, thuc te cho quan ly."
}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                keyDrivers: { type: "STRING" },
                recommendation: { type: "STRING" },
              },
              required: ["summary", "keyDrivers", "recommendation"],
            },
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      return NextResponse.json(buildFallbackResponse(payload));
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      return NextResponse.json(buildFallbackResponse(payload));
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json({
      success: true,
      ...parsed,
    });
  } catch (error: any) {
    console.error("Profit-loss analysis API Route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
