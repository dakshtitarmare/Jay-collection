import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";
import { AuthProvider } from "../features/auth/AuthProvider";

describe("application shell", () => {
  it("renders the sign-in screen when there is no session", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jay Collection")).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Owner sign in" })).toBeTruthy();
    });
  });
});
