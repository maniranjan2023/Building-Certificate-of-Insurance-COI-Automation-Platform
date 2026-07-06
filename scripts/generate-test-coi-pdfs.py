"""Generate two realistic sample COI PDFs for pipeline testing."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
PAGE_W, PAGE_H = letter


def draw_header(c: canvas.Canvas, title: str) -> None:
    c.setFont("Helvetica-Bold", 14)
    c.drawString(0.75 * inch, 10.5 * inch, title)
    c.setFont("Helvetica", 9)
    c.drawString(0.75 * inch, 10.25 * inch, "CERTIFICATE OF LIABILITY INSURANCE")
    c.setStrokeColor(colors.black)
    c.line(0.75 * inch, 10.15 * inch, 7.75 * inch, 10.15 * inch)


def draw_block(c: canvas.Canvas, x: float, y: float, label: str, value: str, width: float = 3.2 * inch) -> float:
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x, y, label)
    c.setFont("Helvetica", 9)
    lines = _wrap(value, 58)
    cy = y - 12
    for line in lines:
        c.drawString(x, cy, line)
        cy -= 11
    c.setStrokeColor(colors.grey)
    c.rect(x - 2, cy - 2, width, y - cy + 14, stroke=1, fill=0)
    return cy - 8


def _wrap(text: str, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def draw_coverage_table(c: canvas.Canvas, y: float, rows: list[tuple[str, str, str, str, str]]) -> float:
    headers = ["INSR LTR", "TYPE OF INSURANCE", "POLICY NUMBER", "EFF (MM/DD/YYYY)", "EXP (MM/DD/YYYY)"]
    col_x = [0.75 * inch, 1.2 * inch, 2.6 * inch, 4.5 * inch, 5.7 * inch, 6.85 * inch]
    c.setFont("Helvetica-Bold", 7)
    for i, header in enumerate(headers):
        c.drawString(col_x[i], y, header)
    y -= 10
    c.line(0.75 * inch, y, 7.75 * inch, y)
    y -= 12
    c.setFont("Helvetica", 8)
    for row in rows:
        c.drawString(col_x[0], y, row[0])
        for i, cell in enumerate(row[1:], start=1):
            c.drawString(col_x[i], y, cell)
        y -= 14
    return y


def draw_limits(c: canvas.Canvas, y: float, limits: list[tuple[str, str]]) -> float:
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.75 * inch, y, "LIMITS — COMMERCIAL GENERAL LIABILITY")
    y -= 14
    c.setFont("Helvetica", 9)
    for label, amount in limits:
        c.drawString(0.9 * inch, y, label)
        c.drawRightString(7.5 * inch, y, amount)
        y -= 14
    return y


def draw_description(c: canvas.Canvas, y: float, text: str) -> float:
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.75 * inch, y, "DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES")
    y -= 12
    c.setFont("Helvetica", 8)
    for line in _wrap(text, 95):
        c.drawString(0.75 * inch, y, line)
        y -= 10
    return y - 6


def draw_certificate_holder(c: canvas.Canvas, y: float, lines: list[str]) -> float:
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.75 * inch, y, "CERTIFICATE HOLDER")
    y -= 12
    c.setFont("Helvetica", 9)
    for line in lines:
        c.drawString(0.75 * inch, y, line)
        y -= 11
    return y


def build_compliant_pdf(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=letter)
    draw_header(c, "ACORD 25 (2016/03)")

    y = 9.85 * inch
    y = draw_block(
        c,
        0.75 * inch,
        y,
        "PRODUCER",
        "Summit Commercial Insurance Group | 880 Westlake Ave, Seattle, WA 98109 | (206) 555-0142",
    )
    draw_block(
        c,
        4.2 * inch,
        9.85 * inch,
        "INSURED",
        "Sunrise Property Services LLC\n425 Harbor View Road\nSan Diego, CA 92101",
        width=3.35 * inch,
    )

    y = min(y, 8.55 * inch)
    y = draw_coverage_table(
        c,
        y,
        [
            (
                "A",
                "COMMERCIAL GENERAL LIABILITY",
                "CGL-7845291",
                "01/01/2026",
                "01/01/2027",
            ),
        ],
    )

    y -= 4
    y = draw_limits(
        c,
        y,
        [
            ("Each Occurrence", "$1,000,000"),
            ("Damage to Rented Premises (Ea occurrence)", "$300,000"),
            ("Med Exp (Any one person)", "$10,000"),
            ("Personal & Adv Injury", "$1,000,000"),
            ("General Aggregate", "$2,000,000"),
            ("Products - Comp/Op Agg", "$2,000,000"),
        ],
    )

    y -= 6
    y = draw_description(
        c,
        y,
        "Coverage applies to tenant operations at 450 Market Plaza, Suite 200, Austin, TX. "
        "Oakwood Property Management LLC is included as Additional Insured on a primary and "
        "non-contributory basis per written contract. Waiver of subrogation applies in favor of "
        "certificate holder where required by written agreement.",
    )

    y -= 8
    y = draw_certificate_holder(
        c,
        y,
        [
            "Oakwood Property Management LLC",
            "1200 Commerce Street",
            "Dallas, TX 75201",
        ],
    )

    y -= 10
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.75 * inch, y, "INSURER(S) AFFORDING COVERAGE")
    y -= 12
    c.setFont("Helvetica", 9)
    c.drawString(0.75 * inch, y, "Insurer A: Hartford Fire Insurance Company (AM Best Rating: A+)")
    y -= 11
    c.drawString(0.75 * inch, y, "NAIC #: 19682")

    y -= 18
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(
        0.75 * inch,
        y,
        "THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER.",
    )

    c.save()


def build_noncompliant_pdf(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=letter)
    draw_header(c, "ACORD 25 (2016/03)")

    y = 9.85 * inch
    y = draw_block(
        c,
        0.75 * inch,
        y,
        "PRODUCER",
        "Bayline Insurance Services | 210 Pine Street, Tampa, FL 33602 | (813) 555-0198",
    )
    draw_block(
        c,
        4.2 * inch,
        9.85 * inch,
        "INSURED",
        "Riverbend Catering Co.\n88 Coastal Drive\nTampa, FL 33605",
        width=3.35 * inch,
    )

    y = min(y, 8.55 * inch)
    y = draw_coverage_table(
        c,
        y,
        [
            (
                "A",
                "COMMERCIAL GENERAL LIABILITY",
                "RB-441902",
                "05/01/2026",
                "05/31/2026",
            ),
        ],
    )

    y -= 4
    y = draw_limits(
        c,
        y,
        [
            ("Each Occurrence", "$300,000"),
            ("Damage to Rented Premises (Ea occurrence)", "$50,000"),
            ("Med Exp (Any one person)", "$5,000"),
            ("Personal & Adv Injury", "$300,000"),
            ("General Aggregate", "$500,000"),
            ("Products - Comp/Op Agg", "$500,000"),
        ],
    )

    y -= 6
    y = draw_description(
        c,
        y,
        "Off-premises catering liability only. Scheduled location: 88 Coastal Drive, Tampa FL. "
        "Additional Insured: None. This certificate does not add Oakwood Property Management LLC "
        "or any property manager, landlord, or lessor as an additional insured. Standard policy "
        "applies; no waiver of subrogation and no primary/non-contributory status is granted.",
    )

    y -= 8
    y = draw_certificate_holder(
        c,
        y,
        [
            "Bayline Tenant Services LLC",
            "400 Harbour Lane",
            "Tampa, FL 33602",
        ],
    )

    y -= 10
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.75 * inch, y, "INSURER(S) AFFORDING COVERAGE")
    y -= 12
    c.setFont("Helvetica", 9)
    c.drawString(0.75 * inch, y, "Insurer A: Coastal Mutual Insurance Company (AM Best Rating: B+)")
    y -= 11
    c.drawString(0.75 * inch, y, "NAIC #: 88214")

    y -= 18
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(
        0.75 * inch,
        y,
        "THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER.",
    )

    c.save()


def main() -> None:
    compliant = ROOT / "coi-sample-compliant.pdf"
    noncompliant = ROOT / "coi-sample-noncompliant.pdf"
    build_compliant_pdf(compliant)
    build_noncompliant_pdf(noncompliant)
    print(f"Created: {compliant}")
    print(f"Created: {noncompliant}")


if __name__ == "__main__":
    main()
