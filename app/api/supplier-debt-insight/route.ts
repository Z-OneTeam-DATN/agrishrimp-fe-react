import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!(await requireAuthenticatedSession())) {
    return NextResponse.json(
      { success: false, message: "Yêu cầu đăng nhập" },
      { status: 401 },
    );
  }

  try {
    const { insightResult, branchName } = await request.json();

    if (!insightResult) {
      return NextResponse.json(
        { success: false, message: "Missing insight result data" },
        { status: 400 }
      );
    }

    if (insightResult.insufficientData) {
      return NextResponse.json({
        success: true,
        summary: "Không thể thực hiện phân tích do thiếu dữ liệu công nợ hoặc lỗi truy cập dữ liệu.",
        recommendation: "Vui lòng kiểm tra lại kết nối cơ sở dữ liệu hoặc thêm dữ liệu phiếu nhập kho."
      });
    }

    const {
      totalOutstandingDebt,
      totalDebtChangeVsPreviousPeriod,
      supplierRanking,
      staffDebtSummary,
      warnings
    } = insightResult;

    const formattedRankings = (supplierRanking || [])
      .slice(0, 5)
      .map((s: any) => `- NCC: ${s.supplierName} (${s.supplierCode}), Tổng nợ: ${s.totalDebt.toLocaleString('vi-VN')} VND, Tuổi nợ TB: ${s.weightedAvgDebtAge.toFixed(1)} ngày, Trạng thái: ${s.ageStatus}, Hạng ưu tiên: ${s.priorityRank}`)
      .join("\n");

    const formattedStaffs = (staffDebtSummary || [])
      .slice(0, 3)
      .map((st: any) => `- Nhân viên: ${st.staffName}, Tổng nợ từ đơn hàng phụ trách: ${st.totalDebtFromOrders.toLocaleString('vi-VN')} VND`)
      .join("\n");

    // Dùng chung cho 2 trường hợp: chưa cấu hình GEMINI_API_KEY hoặc Gemini gọi lỗi — vẫn trả về
    // một bản phân tích tất định dựa trên số liệu backend thay vì chặn hẳn panel AI trên UI.
    const buildFallbackResponse = () => ({
      success: true,
      summary: `Tổng công nợ hiện tại là ${totalOutstandingDebt.toLocaleString('vi-VN')} VND. ${
        totalDebtChangeVsPreviousPeriod !== null && totalDebtChangeVsPreviousPeriod !== undefined
          ? `Thay đổi so với kỳ trước: ${totalDebtChangeVsPreviousPeriod}%.`
          : ""
      } (Bản phân tích chi tiết tạm thời không khả dụng do dịch vụ AI chưa được cấu hình hoặc lỗi kết nối).`,
      recommendation: "Vui lòng theo dõi thứ tự ưu tiên thanh toán nhà cung cấp trong bảng xếp hạng để tối ưu hóa dòng tiền chi trả."
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(buildFallbackResponse());
    }

    const prompt = `
Bạn là một chuyên gia phân tích tài chính doanh nghiệp và cố vấn dòng tiền tối ưu cho chuỗi cửa hàng vật tư thủy sản AgriShrimp.
Dựa trên báo cáo công nợ nhà cung cấp hiện tại của chi nhánh/cửa hàng ${branchName}:
- Tổng công nợ hiện tại: ${totalOutstandingDebt.toLocaleString('vi-VN')} VND
- Xu hướng thay đổi công nợ so với kỳ trước: ${totalDebtChangeVsPreviousPeriod !== null && totalDebtChangeVsPreviousPeriod !== undefined ? `${totalDebtChangeVsPreviousPeriod}%` : "Không có dữ liệu so sánh"}
- Cảnh báo đặc biệt: ${warnings && warnings.length > 0 ? warnings.join("; ") : "Không có cảnh báo đặc biệt"}

Top 5 nhà cung cấp cần ưu tiên xử lý công nợ (sắp xếp theo Priority Rank dựa trên tuổi nợ và quy mô nợ):
${formattedRankings}

Thống kê nợ theo nhân viên phụ trách mua hàng (Top nhân viên tạo nhiều nợ nhất):
${formattedStaffs}

Yêu cầu nhiệm vụ:
Hãy viết một bản phân tích công nợ bằng tiếng Việt giải thích cho chủ cửa hàng/quản trị viên (Admin) tình hình công nợ hiện tại của cửa hàng.
1. Nhận xét tổng quan về tổng công nợ, xu hướng tăng/giảm so với kỳ trước và cảnh báo về phân bổ tuổi nợ của các nhà cung cấp (nếu có nhà cung cấp ở mức CRITICAL hay WARNING).
2. Giải thích lý do tại sao các nhà cung cấp được xếp thứ tự ưu tiên thanh toán như vậy (chú ý phân tích vai trò của tuổi nợ trung bình và quy mô nợ lớn).
3. Đề xuất 3-4 hành động thực tế để tối ưu hóa công nợ, thương lượng giãn nợ hoặc thanh toán phù hợp với từng nhóm nhà cung cấp và nhân viên phụ trách.

Tuyệt đối KHÔNG được tự ý sửa đổi hoặc bịa đặt số tiền, tỷ lệ hoặc thay đổi thứ tự ưu tiên trong bản phân tích, phải luôn tôn trọng kết quả tính toán đã cung cấp.

Yêu cầu định dạng JSON phản hồi:
{
  "summary": "Đoạn văn tóm tắt tình trạng công nợ tổng thể, phân tích xu hướng tăng/giảm và các rủi ro tuổi nợ lớn của các nhà cung cấp.",
  "recommendation": "Đoạn văn đề xuất các hành động thực tế chi tiết (3-4 hành động) để đàm phán giãn nợ, tối ưu hóa thời gian thanh toán và làm việc với nhân viên phụ trách mua hàng."
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
                recommendation: { type: "STRING" }
              },
              required: ["summary", "recommendation"]
            }
          }
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API Error details:", errorText);
      return NextResponse.json(buildFallbackResponse());
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("No response from Gemini content generator");
    }

    const parsedResult = JSON.parse(resultText);

    return NextResponse.json({
      success: true,
      summary: parsedResult.summary,
      recommendation: parsedResult.recommendation
    });

  } catch (error: any) {
    console.error("Error in supplier-debt-insight route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
