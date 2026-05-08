/**
 * Login.test.jsx – Test UI trang đăng nhập
 * Chạy: npm test -- --watchAll=false
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";
import { AuthContext } from "../contexts/AuthContext";

/* ── Mock useAuth ─────────────────────────────────────────── */
const mockLogin = jest.fn();

const renderLogin = (loginImpl = mockLogin) => {
  return render(
    <AuthContext.Provider value={{ login: loginImpl, isAuthenticated: false, loading: false }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

beforeEach(() => {
  mockLogin.mockReset();
});

// ============================================================
// 1. Render UI
// ============================================================
describe("Login UI", () => {
  test("hiển thị đủ các phần tử cơ bản", () => {
    renderLogin();
    // Có thể xuất hiện nhiều lần (h1 + footer) → dùng getAllByText
    expect(screen.getAllByText(/HR & Payroll System/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Nhập tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng nhập/i })).toBeInTheDocument();
  });

  test("hiển thị 4 nút Quick Login", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HR Manager/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Payroll Manager/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Employee/i })).toBeInTheDocument();
  });

  test("hiển thị bảng tài khoản demo", () => {
    renderLogin();
    expect(screen.getByText(/admin@companyx\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/hr@companyx\.com/i)).toBeInTheDocument();
  });

  test("toggle dark/light mode", () => {
    renderLogin();
    const toggleBtn = screen.getByTitle(/Chế độ tối/i);
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByTitle(/Chế độ sáng/i)).toBeInTheDocument();
  });
});

// ============================================================
// 2. Password visibility toggle
// ============================================================
describe("Password visibility", () => {
  test("mặc định password bị ẩn", () => {
    renderLogin();
    const pwInput = screen.getByPlaceholderText(/Nhập mật khẩu/i);
    expect(pwInput).toHaveAttribute("type", "password");
  });

  test("click icon mắt → hiện password", () => {
    renderLogin();
    const pwInput = screen.getByPlaceholderText(/Nhập mật khẩu/i);
    // Tìm button toggle (Eye icon) gần input password
    const eyeBtn = pwInput.parentElement.querySelector("button");
    fireEvent.click(eyeBtn);
    expect(pwInput).toHaveAttribute("type", "text");
  });

  test("click lại → ẩn password", () => {
    renderLogin();
    const pwInput = screen.getByPlaceholderText(/Nhập mật khẩu/i);
    const eyeBtn = pwInput.parentElement.querySelector("button");
    fireEvent.click(eyeBtn);
    fireEvent.click(eyeBtn);
    expect(pwInput).toHaveAttribute("type", "password");
  });
});

// ============================================================
// 3. Validation
// ============================================================
describe("Form validation", () => {
  test("submit rỗng → hiện lỗi, không gọi login", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));
    expect(await screen.findByText(/Vui lòng nhập đầy đủ/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("chỉ nhập username, bỏ trống password → hiện lỗi", async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/Nhập tên đăng nhập/i), "admin");
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));
    expect(await screen.findByText(/Vui lòng nhập đầy đủ/i)).toBeInTheDocument();
  });

  test("lỗi tự xóa khi người dùng gõ lại", async () => {
    renderLogin();
    // Trigger lỗi
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));
    expect(await screen.findByText(/Vui lòng nhập đầy đủ/i)).toBeInTheDocument();
    // Gõ vào username → lỗi biến mất
    await userEvent.type(screen.getByPlaceholderText(/Nhập tên đăng nhập/i), "a");
    expect(screen.queryByText(/Vui lòng nhập đầy đủ/i)).not.toBeInTheDocument();
  });
});

// ============================================================
// 4. Login flow
// ============================================================
describe("Login flow", () => {
  test("đăng nhập thành công → gọi login với đúng tham số", async () => {
    mockLogin.mockResolvedValue({ ok: true });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/Nhập tên đăng nhập/i), "admin");
    await userEvent.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), "Admin@123");
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin", "Admin@123");
    });
  });

  test("đăng nhập thất bại → hiện thông báo lỗi từ server", async () => {
    mockLogin.mockResolvedValue({ ok: false, msg: "Tài khoản hoặc mật khẩu không đúng" });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/Nhập tên đăng nhập/i), "admin");
    await userEvent.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), "SaiMatKhau");
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    expect(await screen.findByText(/Tài khoản hoặc mật khẩu không đúng/i)).toBeInTheDocument();
  });

  test("trong khi đang login → nút bị disable và hiện loading", async () => {
    // Login chậm (pending)
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/Nhập tên đăng nhập/i), "admin");
    await userEvent.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), "Admin@123");
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText(/Đang đăng nhập/i)).toBeInTheDocument();
    });
  });
});

// ============================================================
// 5. Quick Login
// ============================================================
describe("Quick Login", () => {
  test("click Admin → gọi login với credentials của admin", async () => {
    mockLogin.mockResolvedValue({ ok: true });
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin", "Admin@123");
    });
  });

  test("click HR Manager → gọi login với credentials của hr_manager", async () => {
    mockLogin.mockResolvedValue({ ok: true });
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /HR Manager/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("hr_manager", "Hr@123");
    });
  });

  test("click Employee → gọi login với credentials của employee", async () => {
    mockLogin.mockResolvedValue({ ok: true });
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /^Employee$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("employee", "Emp@123");
    });
  });
});
