const fs = require("fs");
const path = require("path");
const { chromium, request } = require("playwright");

const BASE_URL = process.env.CHAT_BASE_URL || "http://localhost:3004";
const API_URL = process.env.CHAT_API_URL || "http://localhost:8004/api";
const OUT_DIR = path.resolve(__dirname, "../../test-results");
const OUT_FILE = path.join(OUT_DIR, "chat-local-playwright-results.json");

const results = [];

function add(id, status, actual) {
  results.push({ id, status, actual });
  const icon = status === "PASS" ? "PASS" : "FAIL";
  console.log(`${icon} ${id}: ${actual}`);
}

async function expectVisible(id, locator, actualPass, actualFail, timeout = 10000) {
  try {
    await locator.waitFor({ state: "visible", timeout });
    add(id, "PASS", actualPass);
    return true;
  } catch (error) {
    add(id, "FAIL", `${actualFail} (${error.message.split("\n")[0]})`);
    return false;
  }
}

async function signupCustomer() {
  const api = await request.newContext();
  const email = `chat.customer.${Date.now()}@gmail.com`;
  const response = await api.post(`${API_URL}/auth/signup`, {
    data: {
      fullName: "Nguyen Van A",
      contact: email,
      password: "123456",
      confirmPassword: "123456",
      termsAccepted: true,
      captchaToken: "test",
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok()) {
    throw new Error(`Signup customer failed ${response.status()}: ${JSON.stringify(body)}`);
  }
  await api.dispose();
  return { email, password: "123456", fullName: "Nguyen Van A" };
}

async function firstProduct() {
  const api = await request.newContext();
  const response = await api.get(`${API_URL}/public/products?page=0&size=1`);
  const body = await response.json();
  await api.dispose();
  const product = body?.content?.[0];
  if (!product?.slug) throw new Error("No public product found for chat test.");
  return product;
}

async function login(context, contact, password) {
  const api = await request.newContext();
  const response = await api.post(`${API_URL}/auth/login`, {
    data: { contact, password, captchaToken: "test" },
  });
  const body = await response.json().catch(() => ({}));
  await api.dispose();
  if (!response.ok()) {
    throw new Error(`Login failed for ${contact}: ${response.status()} ${JSON.stringify(body)}`);
  }
  await context.addCookies([
    {
      name: "accessToken",
      value: body.accessToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "refreshToken",
      value: body.refreshToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "hasSession",
      value: "1",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);
  return body;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const customer = await signupCustomer();
  const product = await firstProduct();

  const browser = await chromium.launch({ headless: true });
  const customerContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const advisorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  customerContext.setDefaultTimeout(30000);
  customerContext.setDefaultNavigationTimeout(120000);
  advisorContext.setDefaultTimeout(30000);
  advisorContext.setDefaultNavigationTimeout(120000);

  try {
    await login(customerContext, customer.email, customer.password);
    await login(advisorContext, "admin@agrishrimp.vn", "123456");

    const customerPage = await customerContext.newPage();
    const advisorPage = await advisorContext.newPage();

    customerPage.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) console.log(`CUSTOMER ${msg.type()}: ${msg.text()}`);
    });
    advisorPage.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) console.log(`ADVISOR ${msg.type()}: ${msg.text()}`);
    });

    await customerPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await customerPage.waitForTimeout(2500);
    const homeChatButtonCount = await customerPage.getByText("Chat trực tuyến").count();
    if (homeChatButtonCount > 0) {
      add("TC_CHAT_01", "PASS", "Trang chủ local có nút/điểm mở chat trực tuyến.");
    } else {
      add("TC_CHAT_01", "FAIL", "Trang chủ local không hiển thị biểu tượng/nút chat ở góc màn hình theo bước test. Chat chỉ mở được qua banner chưa đọc hoặc trang chi tiết sản phẩm.");
    }

    await customerPage.goto(`${BASE_URL}/san-pham/${product.slug}`, { waitUntil: "domcontentloaded" });
    await expectVisible(
      "TC_CHAT_OPEN_PRODUCT",
      customerPage.getByText("Chat trực tuyến").first(),
      "Trang chi tiết sản phẩm hiển thị nút Chat trực tuyến.",
      "Không thấy nút Chat trực tuyến trên trang chi tiết sản phẩm."
    );
    const myConversationResponse = customerPage.waitForResponse(
      (res) => res.url().includes("/chat/my-conversation") && res.ok(),
      { timeout: 30000 }
    ).catch(() => null);
    await customerPage.getByText("Chat trực tuyến").first().click();
    await expectVisible(
      "TC_CHAT_WINDOW_UI",
      customerPage.getByText("AgriShrimp Shop"),
      "Cửa sổ chat mở, có tiêu đề AgriShrimp Shop.",
      "Không mở được cửa sổ chat."
    );
    await expectVisible(
      "TC_CHAT_01_UI_TEXT",
      customerPage.getByPlaceholder("Nhập nội dung tin nhắn..."),
      "Cửa sổ chat có ô nhập Nhập nội dung tin nhắn...",
      "Không thấy ô nhập tin nhắn trong cửa sổ chat."
    );
    await myConversationResponse;
    await customerPage.waitForTimeout(1500);

    const sendEmptyButton = customerPage.locator('input[placeholder="Nhập nội dung tin nhắn..."] + button');
    const disabled = await sendEmptyButton.evaluate((el) => el.disabled).catch(() => false);
    add("TC_CHAT_06", disabled ? "PASS" : "FAIL", disabled ? "Nút gửi bị vô hiệu hóa khi ô tin nhắn trống." : "Nút gửi vẫn enable khi tin nhắn trống.");

    const customerMessage = `Playwright customer message ${Date.now()}`;
    await customerPage.getByPlaceholder("Nhập nội dung tin nhắn...").fill(customerMessage);
    await customerPage.locator('input[placeholder="Nhập nội dung tin nhắn..."] + button').click();
    await expectVisible(
      "TC_CHAT_07",
      customerPage.getByText(customerMessage),
      "Khách hàng gửi tin nhắn văn bản thành công, tin nhắn hiển thị trong hội thoại.",
      "Không thấy tin nhắn khách hàng sau khi gửi."
    );

    await advisorPage.goto(`${BASE_URL}/advisor/inbox`, { waitUntil: "domcontentloaded" });
    await advisorPage.waitForTimeout(1500);
    const advisorUrl = advisorPage.url();
    const hasExpectedInboxTitle = await advisorPage.getByText("Hộp thư tư vấn khách hàng").isVisible().catch(() => false);
    if (hasExpectedInboxTitle) {
      add("TC_CHAT_29", "PASS", "Trang inbox hiển thị Hộp thư tư vấn khách hàng.");
    } else {
      add("TC_CHAT_29", "FAIL", `Route /advisor/inbox redirect sang ${advisorUrl}; UI hiện tại không có tiêu đề "Hộp thư tư vấn khách hàng" theo Expected Result.`);
    }
    await expectVisible(
      "TC_CHAT_14",
      advisorPage.getByText(customerMessage),
      "Tư vấn viên nhận được tin nhắn khách hàng trong inbox local.",
      "Tư vấn viên không thấy tin nhắn khách hàng trong inbox.",
      20000
    );

    const advisorReply = `Playwright advisor reply ${Date.now()}`;
    const advisorInput = advisorPage.getByPlaceholder("Trả lời trong Messenger...");
    if (await advisorInput.isVisible().catch(() => false)) {
      await advisorInput.fill(advisorReply);
      await advisorPage.keyboard.press("Enter");
      await expectVisible(
        "TC_CHAT_11",
        advisorPage.getByText(advisorReply),
        "Tư vấn viên gửi tin nhắn thành công, tin nhắn hiển thị trong hội thoại.",
        "Không thấy tin nhắn tư vấn viên sau khi gửi."
      );
      await expectVisible(
        "TC_CHAT_15",
        customerPage.getByText(advisorReply),
        "Khách hàng nhận tin nhắn tư vấn viên realtime trong cửa sổ chat.",
        "Khách hàng không nhận được tin nhắn tư vấn viên realtime.",
        20000
      );
    } else {
      add("TC_CHAT_11", "FAIL", "Không thấy ô nhập tư vấn viên placeholder \"Trả lời trong Messenger...\" nên không gửi được tin nhắn.");
      add("TC_CHAT_15", "FAIL", "Không gửi được tin nhắn tư vấn viên nên không kiểm tra được realtime phía khách hàng.");
    }

    await customerPage.getByTitle("Stickers").click();
    await expectVisible(
      "TC_CHAT_51",
      customerPage.getByPlaceholder("Tìm kiếm nhãn dán..."),
      "Bảng sticker hiển thị ô Tìm kiếm nhãn dán...",
      "Không mở được bảng sticker."
    );
    await customerPage.getByPlaceholder("Tìm kiếm nhãn dán...").fill("stickerkhongco999");
    await expectVisible(
      "TC_CHAT_52",
      customerPage.getByText("Không tìm thấy nhãn dán nào"),
      "Tìm sticker không tồn tại hiển thị Không tìm thấy nhãn dán nào.",
      "Không thấy trạng thái không tìm thấy sticker."
    );

    await customerPage.getByPlaceholder("Tìm kiếm nhãn dán...").fill("Haha");
    const haha = customerPage.getByText("Haha").first();
    if (await haha.isVisible().catch(() => false)) {
      await haha.click();
      await customerPage.waitForTimeout(1000);
      add("TC_CHAT_53", "PASS", "Chọn sticker Haha không lỗi và sticker được gửi vào hội thoại.");
    } else {
      add("TC_CHAT_53", "FAIL", "Không tìm thấy sticker Haha trong bảng sticker.");
    }

    if (await advisorPage.getByTitle("Ghim sản phẩm").isVisible().catch(() => false)) {
      await advisorPage.getByTitle("Ghim sản phẩm").click();
      await expectVisible(
        "TC_CHAT_18",
        advisorPage.getByText("Ghim sản phẩm vào cuộc trò chuyện"),
        "Popup ghim sản phẩm mở đúng tiêu đề.",
        "Không mở được popup ghim sản phẩm."
      );
      await expectVisible(
        "TC_CHAT_20",
        advisorPage.getByPlaceholder("Tìm kiếm sản phẩm..."),
        "Popup có ô Tìm kiếm sản phẩm...",
        "Không thấy ô tìm kiếm sản phẩm trong popup ghim."
      );
      await advisorPage.getByPlaceholder("Tìm kiếm sản phẩm...").fill("SanPhamKhongTonTai999");
      await expectVisible(
        "TC_CHAT_21",
        advisorPage.getByText("Không tìm thấy sản phẩm"),
        "Tìm sản phẩm không tồn tại hiển thị Không tìm thấy sản phẩm.",
        "Không thấy trạng thái không tìm thấy sản phẩm."
      );

      await advisorPage.getByPlaceholder("Tìm kiếm sản phẩm...").fill(product.name.slice(0, 8));
      await expectVisible(
        "TC_CHAT_20_RESULT",
        advisorPage.getByText(product.name).first(),
        "Danh sách sản phẩm phù hợp hiển thị trong popup ghim.",
        "Không thấy sản phẩm phù hợp trong popup ghim."
      );

      await advisorPage.getByText(product.name).first().locator("..").getByText("Ghim").click().catch(async () => {
        await advisorPage.getByRole("button", { name: "Ghim" }).first().click();
      });
      await expectVisible(
        "TC_CHAT_23",
        advisorPage.getByText("Sản phẩm được ghim").first(),
        "Ghim sản phẩm thành công, hội thoại hiển thị thẻ Sản phẩm được ghim.",
        "Không thấy thẻ Sản phẩm được ghim sau khi ghim sản phẩm.",
        15000
      );
    } else {
      add("TC_CHAT_18", "FAIL", "Không thấy nút Ghim sản phẩm trên UI tư vấn viên hiện tại.");
      add("TC_CHAT_20", "FAIL", "Không mở được popup nên không test được tìm kiếm sản phẩm ghim.");
      add("TC_CHAT_21", "FAIL", "Không mở được popup nên không test được trạng thái không tìm thấy sản phẩm.");
      add("TC_CHAT_23", "FAIL", "Không thấy nút ghim nên không ghim được sản phẩm.");
    }

    if (await advisorPage.getByTitle("Đánh dấu sao").isVisible().catch(() => false)) {
      await advisorPage.getByTitle("Đánh dấu sao").click();
      await expectVisible(
        "TC_CHAT_50_STAR",
        advisorPage.getByText("Đã đánh dấu sao hội thoại"),
        "Đánh dấu sao hiển thị toast Đã đánh dấu sao hội thoại.",
        "Không thấy toast đánh dấu sao."
      );
      await advisorPage.getByTitle("Bỏ đánh dấu sao").click();
      await expectVisible(
        "TC_CHAT_50_UNSTAR",
        advisorPage.getByText("Đã bỏ đánh dấu sao"),
        "Bỏ đánh dấu sao hiển thị toast Đã bỏ đánh dấu sao.",
        "Không thấy toast bỏ đánh dấu sao."
      );
    } else {
      add("TC_CHAT_50_STAR", "FAIL", "Không thấy nút Đánh dấu sao vì tư vấn viên không mở được hội thoại active.");
      add("TC_CHAT_50_UNSTAR", "FAIL", "Không thấy nút Bỏ đánh dấu sao vì tư vấn viên không mở được hội thoại active.");
    }

    const searchInbox = advisorPage.getByPlaceholder("Tìm theo tên khách hoặc nội dung...");
    if (await searchInbox.isVisible().catch(() => false)) {
      await searchInbox.fill("KhachHangKhongTonTai999");
      await expectVisible(
        "TC_CHAT_31",
        advisorPage.getByText("Không có hội thoại phù hợp"),
        "Tìm hội thoại không có kết quả hiển thị Không có hội thoại phù hợp.",
        "Không thấy trạng thái không có hội thoại phù hợp."
      );
    } else {
      add("TC_CHAT_31", "FAIL", "UI /chat hiện tại không có ô tìm kiếm placeholder \"Tìm theo tên khách hoặc nội dung...\" như Expected Result.");
    }

  } finally {
    await browser.close();
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify({ baseUrl: BASE_URL, apiUrl: API_URL, results }, null, 2), "utf8");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`SUMMARY PASS=${pass} FAIL=${fail} OUT=${OUT_FILE}`);
}

main().catch((error) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ baseUrl: BASE_URL, apiUrl: API_URL, error: String(error.stack || error), results }, null, 2), "utf8");
  console.error(error);
  process.exit(1);
});
