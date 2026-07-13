import { NextResponse } from "next/server";

// Cache in-memory: key -> { data, expiresAt }
// TTL = 15 minutes = 15 * 60 * 1000 ms
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { insightResult, branchName, startDate, endDate } = await request.json();

    if (!insightResult) {
      return NextResponse.json(
        { success: false, message: "Missing insight result data" },
        { status: 400 }
      );
    }

    // Construct cache key
    const cacheKey = `${branchName || "ALL"}-${startDate || "N/A"}-${endDate || "N/A"}`;
    const now = Date.now();

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      if (now < cached.expiresAt) {
        console.log(`[Cache Hit] Returning cached AI analysis for key: ${cacheKey}`);
        return NextResponse.json({ success: true, ...cached.data });
      } else {
        cache.delete(cacheKey);
      }
    }

    const {
      netProfitChangePercent,
      contributionBreakdown,
      cogsRatio,
      cogsRatioStatus,
      returnRatio,
      returnRatioStatus,
      isNetProfitNegative,
      excludedZeroFields,
      warnings
    } = insightResult;

    const formattedBreakdowns = (contributionBreakdown || [])
      .map((item: any) => {
        const prevStr = item.previousValue !== null && item.previousValue !== undefined 
          ? `${item.previousValue.toLocaleString('vi-VN')} VND` 
          : "N/A (Chưa có)";
        const changeStr = item.changeAmount !== null && item.changeAmount !== undefined
          ? `${item.changeAmount.toLocaleString('vi-VN')} VND`
          : "N/A (Chưa có)";
        return `- Chỉ tiêu: ${item.factor}, Kỳ này: ${item.currentValue.toLocaleString('vi-VN')} VND, Kỳ trước: ${prevStr}, Chênh lệch: ${changeStr}\n  Ghi chú: ${item.note}`;
      })
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Iv-nYPt9GDOcfk3NF48uF4vH7cVOtMJAIv_TLHgdGBRA";

    const prompt = `
Bạn là một chuyên gia phân tích tài chính doanh nghiệp và cố vấn dòng tiền tối ưu cho chuỗi cửa hàng vật tư thủy sản AgriShrimp.
Dựa trên kết quả tính toán định lượng (rule-based) của Báo cáo Lãi Lỗ (P&L) tại chi nhánh/cửa hàng "${branchName}":
- Tỷ lệ giá vốn/doanh thu thuần (cogsRatio): ${cogsRatio}% (Trạng thái: ${cogsRatioStatus})
- Tỷ lệ hàng bán bị trả lại/doanh thu gốc (returnRatio): ${returnRatio}% (Trạng thái: ${returnRatioStatus})
- Lợi nhuận ròng bị âm: ${isNetProfitNegative ? "Có (Đang lỗ)" : "Không (Có lãi)"}
- Phần trăm thay đổi lợi nhuận ròng: ${netProfitChangePercent === "NO_PREVIOUS_DATA" ? "Chưa có dữ liệu kỳ trước để so sánh" : `${netProfitChangePercent}%`}
- Danh sách cảnh báo hiện tại: ${warnings && warnings.length > 0 ? warnings.join("; ") : "Không có cảnh báo đặc biệt"}

Bảng phân rã các chỉ tiêu đóng góp (contributionBreakdown):
${formattedBreakdowns}

--- RÀNG BUỘC PHÂN TÍCH QUAN TRỌNG:
1. Nếu Phần trăm thay đổi lợi nhuận ròng là "NO_PREVIOUS_DATA", hãy nêu rõ đây là kỳ báo cáo đầu tiên của cửa hàng hoặc chưa có dữ liệu quá khứ tương thích để so sánh. Tuyệt đối KHÔNG diễn giải thành tăng trưởng vượt bậc hoặc tăng trưởng 100%.
2. Danh sách các chỉ tiêu sau đang bằng 0đ do hệ thống chưa hỗ trợ mô-đun tương ứng: [${(excludedZeroFields || []).join(", ")}]. Hãy bỏ qua và tuyệt đối KHÔNG đưa các chỉ tiêu này vào nhận xét tích cực/tiêu cực nào (không ca ngợi việc kiểm soát chi phí của các trường này).
3. Nếu lợi nhuận ròng bị âm (isNetProfitNegative = true), hãy phân tích với giọng điệu điềm tĩnh, khách quan và mang tính xây dựng. Không dùng ngôn từ cảnh báo nguy hiểm/khẩn cấp thái quá vì đây có thể là hiện tượng bình thường khi mới hoạt động hoặc lọc khoảng thời gian ngắn. Tập trung vào tìm hiểu nguyên nhân chính như giá vốn cao hay hoàn trả nhiều đơn.
4. Tuyệt đối KHÔNG tự ý bịa đặt số tiền, tỷ lệ hoặc thay đổi số liệu đã tính toán ở trên.

Yêu cầu định dạng JSON phản hồi:
{
  "summary": "Đoạn văn tóm tắt tình trạng doanh thu, giá vốn và lợi nhuận tổng thể của kỳ này, nêu rõ xu hướng và các chỉ số biên gộp/tỷ lệ hoàn hàng.",
  "keyDrivers": "Đoạn phân tích chi tiết nguyên nhân chính tác động đến lợi nhuận dựa trên bảng phân rã contributionBreakdown (yếu tố nào kéo lợi nhuận lên/xuống nhiều nhất).",
  "recommendation": "Đoạn văn đề xuất 3 hành động cụ thể thiết thực nhất (về giá vốn, quản lý hoàn hàng hoặc chiết khấu) để cải thiện hiệu quả tài chính cửa hàng."
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
                recommendation: { type: "STRING" }
              },
              required: ["summary", "keyDrivers", "recommendation"]
            }
          }
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini P&L API Error details:", errorText);

      // Deterministic Fallback text
      const fallbackData = {
        summary: `Báo cáo lãi lỗ ghi nhận tỷ lệ giá vốn đạt ${cogsRatio}% trên doanh thu thuần. ${
          isNetProfitNegative ? "Kỳ này cửa hàng ghi nhận lợi nhuận ròng âm." : "Cửa hàng ghi nhận lợi nhuận dương trong kỳ."
        } (Bản phân tích chi tiết tạm thời không khả dụng do lỗi kết nối AI).`,
        keyDrivers: "Biến động lợi nhuận chịu ảnh hưởng trực tiếp từ giá vốn và tỷ lệ hoàn trả hàng từ khách hàng.",
        recommendation: "Khuyến nghị rà soát cơ cấu giá vốn của các sản phẩm chủ lực và kiểm tra nguyên nhân các đơn hàng bị khách trả lại."
      };

      return NextResponse.json({ success: true, ...fallbackData });
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    const parsedResult = JSON.parse(resultText);

    // Save to cache before returning
    cache.set(cacheKey, {
      data: parsedResult,
      expiresAt: now + CACHE_TTL_MS
    });
    console.log(`[Cache Write] Saved AI analysis for key: ${cacheKey}`);

    return NextResponse.json({
      success: true,
      summary: parsedResult.summary,
      keyDrivers: parsedResult.keyDrivers,
      recommendation: parsedResult.recommendation
    });

  } catch (error: any) {
    console.error("Error in profit-loss-insight route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
