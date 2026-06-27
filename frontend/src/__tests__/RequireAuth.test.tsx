import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RequireAuth from "@/components/auth/RequireAuth";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
}));

const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/learn",
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: mockReplace }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

describe("RequireAuth", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    toastError.mockClear();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("shows loading when isLoading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    } as ReturnType<typeof useAuth>);

    const { container } = render(
      <RequireAuth><div>protected</div></RequireAuth>
    );

    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByText("protected")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login with redirectTo when unauthenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(<RequireAuth><div>protected</div></RequireAuth>);

    expect(toastError).toHaveBeenCalledWith("Vui lòng đăng nhập để tiếp tục.");
    expect(mockReplace).toHaveBeenCalledWith(
      "/vi/login?redirectTo=%2Fvi%2Flearn"
    );
    expect(screen.queryByText("protected")).toBeNull();
  });

  it("preserves query string in redirectTo", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("?x=1"));
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(<RequireAuth><div>protected</div></RequireAuth>);

    expect(mockReplace).toHaveBeenCalledWith(
      "/vi/login?redirectTo=%2Fvi%2Flearn%3Fx%3D1"
    );
  });

  it("renders children when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(<RequireAuth><div>protected</div></RequireAuth>);

    expect(screen.getByText("protected")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
