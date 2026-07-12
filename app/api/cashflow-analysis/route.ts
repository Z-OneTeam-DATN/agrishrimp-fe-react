import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cashflowRisk } = await request.json();

    if (!cashflowRisk) {
      return NextResponse.json(
        { success: false, message: "Missing cashflow risk data" },
        { status: 400 }
      );
    }

    if (cashflowRisk.insufficientData) {
      return NextResponse.json({
        success: true,
        reasoning: "Không có đủ dữ liệu dòng tiền trong hệ thống để thực hiện phân tích rủi ro.",
        actions: ["Thực hiện thêm giao dịch sổ quỹ hoặc đơn hàng để chạy phân tích."],
        prioritiesExplanation: "Không có danh sách công nợ nào cần ưu tiên sắp xếp."
      });
    }

    const {
      riskLevel,
      currentBalance,
      expectedInflow,
      totalDebtDueInWindow,
      projectedBalance,
      shortfallAmount,
      prioritizedDebts,
      warnings
    } = cashflowRisk;

    const formattedDebts = (prioritizedDebts || [])
      .map((d: any) => `- NCC: ${d.supplierName}, Số tiền nợ: ${d.outstandingAmount.toLocaleString('vi-VN')} VND, Hạn trả gần nhất: ${d.dueDate}, Điểm ưu tiên: ${d.priorityScore} (Hạng ${d.priorityRank})`)
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Iv-nYPt9GDOcfk3NF48uF4vH7cVOtMJAIv_TLHgdGBRA";

    const prompt = `
Bạn là một chuyên gia phân tích tài chính doanh nghiệp và cố vấn dòng tiền tối ưu cho chuỗi cửa hàng vật tư thủy sản AgriShrimp.
Dựa trên báo cáo tài chính và rủi ro dòng tiền hiện tại của cửa hàng:
- Mức độ rủi ro dòng tiền: ${riskLevel}
- Số dư sổ quỹ hiện tại ( closingBalance ): ${currentBalance.toLocaleString('vi-VN')} VND
- Dòng tiền thu dự kiến (Đơn hàng đã bán/chưa đối soát COD): ${expectedInflow.toLocaleString('vi-VN')} VND
- Tổng công nợ nhà cung cấp đến hạn thanh toán trong kỳ: ${totalDebtDueInWindow.toLocaleString('vi-VN')} VND
- Số dư dự kiến cuối kỳ xét duyệt (Số dư hiện tại + Dòng tiền thu dự kiến): ${projectedBalance.toLocaleString('vi-VN')} VND
- Số tiền hụt dòng tiền (Shortfall): ${shortfallAmount.toLocaleString('vi-VN')} VND
- Cảnh báo đặc biệt: ${warnings && warnings.length > 0 ? warnings.join("; ") : "Không có cảnh báo đặc biệt"}

Danh sách nợ nhà cung cấp được sắp xếp theo thứ tự ưu tiên thanh toán (Priority Rank):
${formattedDebts}

Yêu cầu nhiệm vụ:
Hãy viết một bản phân tích tài chính bằng tiếng Việt giải thích cho chủ cửa hàng/quản trị viên (Admin) lý do đằng sau mức độ rủi ro ${riskLevel} và đề xuất 3-4 hành động thực tế để tối ưu dòng tiền, cải thiện thanh khoản cũng như giải thích cơ sở thứ tự ưu tiên thanh toán nhà cung cấp đã được lập sẵn.
Tuyệt đối KHÔNG được tự ý sửa đổi số tiền, tỷ lệ hoặc thay đổi thứ tự ưu tiên trong bản phân tích, phải luôn tôn trọng kết quả tính toán do backend cung cấp.

Yêu cầu định dạng JSON phản hồi:
{
  "reasoning": "Đoạn văn phân tích chi tiết tình trạng dòng tiền hiện tại của cửa hàng, lý do tại sao ở mức độ rủi ro ${riskLevel} (phân tích sự tương quan giữa số dư hiện tại, thu COD dự kiến và nợ phải trả).",
  "actions": [
    "Hành động cụ thể 1 (Ví dụ: liên hệ đối tác giao hàng đối soát nhanh các đơn COD chưa nhận tiền...)",
    "Hành động cụ thể 2 (Ví dụ: thương lượng giãn nợ với các NCC ở hạng thấp hơn...)",
    "Hành động cụ thể 3 (Ví dụ: kích cầu bán nhanh hàng tồn kho thu tiền mặt...)"
  ],
  "prioritiesExplanation": "Đoạn văn giải thích rõ tại sao các nhà cung cấp được xếp thứ tự ưu tiên như vậy (dựa trên các yếu tố: độ trễ hạn của khoản nợ, tần suất nhập hàng và quy mô công nợ của NCC đó để bảo vệ uy tín cửa hàng)."
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
                reasoning: { type: "STRING" },
                actions: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                prioritiesExplanation: { type: "STRING" }
              },
              required: ["reasoning", "actions", "prioritiesExplanation"]
            }
          }
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini Cashflow API Error details:", errorText);
      
      // Fallback response with simple deterministic reasoning
      let fallbackReason = `Tình trạng dòng tiền hiện tại ở mức ${riskLevel}.`;
      let fallbackActions = [
        "Chủ động liên hệ đơn vị vận chuyển đối soát nhanh các đơn hàng COD đã hoàn thành.",
        "Xem xét thương lượng giãn nợ với các nhà cung cấp có công nợ lớn.",
        "Kích hoạt các chương trình khuyến mãi tăng doanh thu thu tiền mặt."
      ];
      
      if (riskLevel === "SAFE") {
        fallbackReason = "Dòng tiền hiện tại của cửa hàng đang rất an toàn, đảm bảo hoàn thành tất cả các nghĩa vụ thanh toán trong kỳ.";
        fallbackActions = ["Duy trì tiến độ thu chi hiện tại.", "Tập trung tối ưu thêm vòng quay hàng tồn kho."];
      } else if (riskLevel === "CRITICAL") {
        if (totalDebtDueInWindow > 0) {
          fallbackReason = `Cảnh báo: Dòng tiền đang thiếu hụt nghiêm trọng khoảng ${shortfallAmount.toLocaleString('vi-VN')} VND so với nợ đến hạn thanh toán trong kỳ.`;
        } else {
          fallbackReason = `Cảnh báo: Quỹ hiện đang âm ${Math.abs(currentBalance).toLocaleString('vi-VN')} VND, dòng tiền dự phòng thiếu hụt nghiêm trọng.`;
          fallbackActions = [
            "Tập trung đối soát các đơn hàng COD để thu hồi vốn nhanh.",
            "Tạm thời hạn chế các khoản chi không cấp bách.",
            "Kích hoạt các chương trình khuyến mãi tăng doanh thu thu tiền mặt."
          ];
        }
      }

      return NextResponse.json({
        success: true,
        reasoning: fallbackReason,
        actions: fallbackActions,
        prioritiesExplanation: "Ưu tiên sắp xếp theo mức độ cấp bách quá hạn và sự gắn bó/tần suất nhập hàng lâu năm của các nhà cung cấp."
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
    console.error("Cashflow Analysis API Route error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
