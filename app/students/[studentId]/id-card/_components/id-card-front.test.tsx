import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IdCardFront } from "./id-card-front";
import { makeIdCard } from "./test-fixtures";

describe("IdCardFront", () => {
  it("renders the student's name, admission number, class/section, and DOB", () => {
    render(<IdCardFront card={makeIdCard()} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/ADM202600001/)).toBeInTheDocument();
    expect(screen.getByText(/Grade 5/)).toBeInTheDocument();
    expect(screen.getByText(/5\/15\/2016|15\/5\/2016/)).toBeInTheDocument();
  });

  it("renders the school name", () => {
    render(<IdCardFront card={makeIdCard()} />);
    expect(screen.getByText("EduPilot Demo School")).toBeInTheDocument();
  });

  it("shows initials when no photo is available", () => {
    render(<IdCardFront card={makeIdCard({ photoUrl: null })} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders the photo image when a photoUrl is available", () => {
    render(
      <IdCardFront card={makeIdCard({ photoUrl: "https://storage.example.com/signed/photo.jpg" })} />
    );
    const img = screen.getByAltText("Jane Doe");
    expect(img).toHaveAttribute("src", "https://storage.example.com/signed/photo.jpg");
  });

  it("does not render a class/section line when there is no current enrollment", () => {
    render(<IdCardFront card={makeIdCard({ academic: null })} />);
    expect(screen.queryByText(/Class:/)).not.toBeInTheDocument();
  });
});
