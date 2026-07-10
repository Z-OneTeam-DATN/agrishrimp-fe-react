import { NextResponse } from "next/server";

export interface ProfitLossData {
  grossRevenue: number;
  returnedGoods: number;
  shippingFeeCollected: number;
  shippingFeeReturned: number;
  discount: number;
  discountReturned: number;
  netProductRevenue: number;
  netRevenue: number;
  cogs: number;
  pointPayment: number;
  shippingFeePaid: number;
  grossProfit: number;
  otherIncome: number;
  customerReturnFee: number;
  otherExpenses: number;
  netProfit: number;
}

function calculateRuleBasedSuggestion(pnl: ProfitLossData, currentMargin: number) {
  const netRevenue = Number(pnl?.netRevenue ?? 0);
  const cogs = Number(pnl?.cogs ?? 0);
  const totalExpense = Number(pnl?.cogs ?? 0) + Number(pnl?.shippingFeePaid ?? 0) + Number(pnl?.pointPayment ?? 0) + Number(pnl?.otherExpenses ?? 0);
  const netProfit = Number(pnl?.netProfit ?? 0);

  let suggestedMargin = currentMargin;
  let suggestedRoundingRule: "NONE" | "STEP_500" | "STEP_1000" | "TAIL_99000" = "STEP_1000";

  // Calculate current net profit margin
  const currentNetProfitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  // Let's decide target suggested margin
  if (cogs > 0) {
    // We target a healthy 12% net profit margin
    const targetNetProfitMargin = 12; // 12% target
    const targetRevenue = totalExpense / (1 - targetNetProfitMargin / 100);
    const calculatedMargin = ((targetRevenue / cogs) - 1) * 100;
    
    // Smooth the adjustment: max step is +/- 15%
    const rawMargin = Math.max(5, Math.min(80, calculatedMargin));
    const difference = rawMargin - currentMargin;
    const maxChange = 15;
    const boundedDifference = Math.max(-maxChange, Math.min(maxChange, difference));
    suggestedMargin = Math.round((currentMargin + boundedDifference) * 10) / 10;
  } else {
    // If no COGS, suggest based on net profit margin directly
    if (netRevenue > 0 && currentNetProfitMargin < 5) {
      suggestedMargin = Math.min(80, currentMargin + 5);
    } else if (netRevenue > 0 && currentNetProfitMargin > 25) {
      suggestedMargin = Math.max(5, currentMargin - 2);
    }
  }

  // Determine rounding rule suggestion based on suggested margin price range
  if (suggestedMargin > 30) {
    suggestedRoundingRule = "TAIL_99000";
  } else {
    suggestedRoundingRule = "STEP_1000";
  }

  return {
    suggestedMargin,
    suggestedRoundingRule,
    currentNetProfitMargin,
    totalExpense,
    netRevenue,
    netProfit
  };
}

export async function POST(request: Request) {
  try {
    const { pnl, currentMargin, productCount } = await request.json();

    if (!pnl) {
      return NextResponse.json(
        { success: false, message: "Missing profit & loss data" },
        { status: 400 }
      );
    }

    const currentMarginNum = typeof currentMargin === "number" ? currentMargin : Number(currentMargin || 30);
    const productCountNum = typeof productCount === "number" ? productCount : Number(productCount || 0);

    // 1. Calculate suggested pricing metrics using Rule-based engine (100% deterministic)
    const ruleResult = calculateRuleBasedSuggestion(pnl, currentMarginNum);
    const {
      suggestedMargin,
      suggestedRoundingRule,
      currentNetProfitMargin,
      totalExpense,
      netRevenue,
      netProfit,
    } = ruleResult;

    // 1.5 Check for insufficient P&L data (prevent false suggestions when there are no sales)
    const cogs = Number(pnl?.cogs ?? 0);
    if (netRevenue <= 0 || cogs <= 0 || totalExpense <= 0) {
      return NextResponse.json({
        success: true,
        insufficientData: true,
        message: "Không đủ dữ liệu bán hàng trong 30 ngày gần đây để tiến hành phân tích tài chính (doanh thu hoặc chi phí bằng 0). Vui lòng cấu hình biên lợi nhuận thủ công."
      });
    }

    // 2. Call Gemini API to write natural explanation (reasoning & analysis) without letting it make up numbers
    const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Iv-nYPt9GDOcfk3NF48uF4vH7cVOtMJAIv_TLHgdGBRA";
    
    const prompt = `
Bạn là một chuyên gia phân tích tài chính và định giá bán lẻ cho chuỗi cửa hàng thủy hải sản AgriShrimp.
Dựa trên các chỉ số hoạt động kinh doanh thực tế trong 30 ngày gần đây của cửa hàng:
- Số lượng sản phẩm/biến thể: ${productCountNum}
- Doanh thu thuần: ${netRevenue.toLocaleString('vi-VN')} VND
- Giá vốn hàng bán (COGS): ${pnl.cogs?.toLocaleString('vi-VN') ?? '0'} VND
- Tổng chi phí vận hành (Gồm giá vốn, vận chuyển, tích điểm, chi phí khác): ${totalExpense.toLocaleString('vi-VN')} VND
- Lợi nhuận ròng hiện tại: ${netProfit.toLocaleString('vi-VN')} VND (Tỷ suất lợi nhuận ròng: ${currentNetProfitMargin.toFixed(2)}%)
- Biên lợi nhuận hiện tại đang cấu hình: ${currentMarginNum}%

Hệ thống đã tính toán bằng công thức tài chính cứng (Rule-based) và đề xuất:
- Biên lợi nhuận đề xuất mới: ${suggestedMargin}%
- Quy tắc làm tròn đề xuất mới: ${suggestedRoundingRule}

Yêu cầu nhiệm vụ:
Hãy viết một bản phân tích ngắn gọn, súc tích bằng tiếng Việt giải thích cho người quản trị (Admin) lý do đằng sau các đề xuất này. Tuyệt đối KHÔNG thay đổi các con số đề xuất (luôn dùng suggestedMargin là ${suggestedMargin}% và suggestedRoundingRule là "${suggestedRoundingRule}" trong phần lý giải).

Yêu cầu định dạng JSON phản hồi:
{
  "suggestedMargin": ${suggestedMargin},
  "suggestedRoundingRule": "${suggestedRoundingRule}",
  "reasoning": "Đoạn giải thích chi tiết lý do tại sao hệ thống đề xuất biên lợi nhuận này và quy tắc làm tròn này, dựa trên mục tiêu lợi nhuận ròng 12% và tình hình doanh thu/chi phí thực tế.",
  "analysis": {
    "financialHealth": "Mô tả ngắn gọn về sức khỏe tài chính hiện tại (ví dụ: Tốt, ổn định, hoặc cần cải thiện biên lợi nhuận do chi phí vận hành cao).",
    "costImpact": "Phân tích tác động của giá vốn hàng bán và các chi phí khác đối với lợi nhuận.",
    "competitiveness": "Đánh giá khả năng cạnh tranh về giá trên thị trường khi áp dụng biên lợi nhuận này."
  }
}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
                suggestedMargin: { type: "NUMBER" },
                suggestedRoundingRule: { type: "STRING" },
                reasoning: { type: "STRING" },
                analysis: {
                  type: "OBJECT",
                  properties: {
                    financialHealth: { type: "STRING" },
                    costImpact: { type: "STRING" },
                    competitiveness: { type: "STRING" },
                  },
                  required: ["financialHealth", "costImpact", "competitiveness"],
                },
              },
              required: ["suggestedMargin", "suggestedRoundingRule", "reasoning", "analysis"],
            },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API Error details:", errorText);
      // Fallback response with Rule-based calculation if Gemini fails
      return NextResponse.json({
        success: true,
        suggestedMargin,
        suggestedRoundingRule,
        reasoning: `Hệ thống đề xuất biên lợi nhuận ${suggestedMargin}% dựa trên phân tích chi phí thực tế là ${totalExpense.toLocaleString('vi-VN')} VND nhằm đạt mục tiêu lợi nhuận ròng 12%.`,
        analysis: {
          financialHealth: currentNetProfitMargin < 5 ? "Cần cải thiện (Biên lợi nhuận ròng thấp)" : "Khá tốt",
          costImpact: "Giá vốn chiếm tỷ lệ cao trong doanh thu, cần tối ưu giá bán.",
          competitiveness: "Đảm bảo bù đắp chi phí mà vẫn giữ được giá cạnh tranh vừa phải.",
        },
      });
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("No response from Gemini content generator");
    }

    const parsedResult = JSON.parse(resultText);
    return NextResponse.json({
      success: true,
      ...parsedResult,
    });
  } catch (error: any) {
    console.error("API Route error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
