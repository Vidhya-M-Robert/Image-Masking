"""Generate the project-team Corppass onboarding flow PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


OUT = Path(__file__).with_name("Corppass_Vendor_Onboarding_and_Verification_Flow.pdf")
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("DVS", str(FONT_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DVS-Bold", str(FONT_DIR / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily("DVS", normal="DVS", bold="DVS-Bold")

W, H = A4
L, R = 62, W - 62
CW = R - L
NAVY = colors.HexColor("#16334d")
BLUE = colors.HexColor("#1878a8")
TEAL = colors.HexColor("#0aa3a2")
PALE_TEAL = colors.HexColor("#e5f4f2")
PALE_BLUE = colors.HexColor("#f1f6f9")
INK = colors.HexColor("#243447")
MUTED = colors.HexColor("#5d7489")
LINE = colors.HexColor("#ccdae3")
WHITE = colors.white
AMBER = colors.HexColor("#d58e12")
PALE_AMBER = colors.HexColor("#fff5df")
RED = colors.HexColor("#aa4c46")
PALE_RED = colors.HexColor("#fbeeed")


def p(c, text, x, top, width, *, size=9.6, leading=None, color=INK,
      bold=False, align=TA_LEFT):
    style = ParagraphStyle(
        "body", fontName="DVS-Bold" if bold else "DVS", fontSize=size,
        leading=leading or size * 1.43, textColor=color, alignment=align,
        spaceBefore=0, spaceAfter=0, allowWidows=0, allowOrphans=0,
    )
    para = Paragraph(text, style)
    _, height = para.wrap(width, H)
    para.drawOn(c, x, top - height)
    return top - height


def label(c, text, x, y, *, size=8.1, color=MUTED, bold=False):
    c.setFont("DVS-Bold" if bold else "DVS", size)
    c.setFillColor(color)
    c.drawString(x, y, text)


def line(c, x1, y1, x2, y2, color=LINE, width=0.7):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)


def rect(c, x, y, w, h, fill, stroke=None, radius=0):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, radius, stroke=int(stroke is not None), fill=1)


def page(c, n):
    label(c, "CORPPASS", L, H - 30, size=7.7, color=MUTED, bold=True)
    c.setFont("DVS", 7.4)
    c.setFillColor(MUTED)
    c.drawRightString(R, H - 30, "Vendor Onboarding & Verification Flow")
    line(c, L, H - 39, R, H - 39)
    line(c, L, 47, R, 47)
    label(c, "Project team reference | 15 October 2026", L, 35, size=7, color=MUTED)
    c.setFont("DVS", 7)
    c.setFillColor(MUTED)
    c.drawRightString(R, 35, str(n))


def title(c, text, sub=None):
    y = H - 70
    y = p(c, text, L, y, CW, size=19.2, leading=25.5, color=NAVY, bold=True)
    if sub:
        y -= 7
        y = p(c, sub, L, y, CW, size=9.3, color=MUTED)
    return y


def section(c, text, y):
    p(c, text, L, y, CW, size=12.2, leading=17, color=BLUE, bold=True)
    return y - 23


def callout(c, x, top, w, h, heading, body, *, fill=PALE_TEAL,
            accent=TEAL, body_size=9.0):
    rect(c, x, top - h, w, h, fill, LINE)
    rect(c, x, top - h, 3, h, accent)
    p(c, heading, x + 11, top - 10, w - 22, size=9.6, color=NAVY, bold=True)
    p(c, body, x + 11, top - 29, w - 22, size=body_size, leading=13.1)


def arrow_down(c, x, y1, y2, color=TEAL, width=1.55):
    line(c, x, y1, x, y2 + 5, color, width)
    c.setFillColor(color)
    path = c.beginPath()
    path.moveTo(x - 4, y2 + 7)
    path.lineTo(x + 4, y2 + 7)
    path.lineTo(x, y2)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def arrow_right(c, x1, x2, y, color=AMBER):
    line(c, x1, y, x2 - 5, y, color, 1.3)
    c.setFillColor(color)
    path = c.beginPath()
    path.moveTo(x2 - 7, y + 4)
    path.lineTo(x2 - 7, y - 4)
    path.lineTo(x2, y)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def stage(c, x, cy, w, h, number, heading, actor, *, final=False):
    fill = PALE_TEAL if final else WHITE
    rect(c, x, cy - h / 2, w, h, fill, TEAL if final else LINE, radius=2.5)
    rect(c, x, cy - h / 2, 29, h, TEAL if final else NAVY)
    c.setFont("DVS-Bold", 10.0)
    c.setFillColor(WHITE)
    c.drawCentredString(x + 14.5, cy - 3.5, str(number))
    p(c, heading, x + 39, cy + 14, w - 49, size=9.1, leading=11.6,
      color=NAVY, bold=True)
    label(c, actor, x + 39, cy - 16, size=7.3, color=MUTED)


def branch(c, x, cy, w, h, heading, body, *, fill=PALE_AMBER,
           accent=AMBER):
    rect(c, x, cy - h / 2, w, h, fill, accent, radius=2)
    heading_bottom = p(c, heading, x + 8, cy + h / 2 - 7,
                       w - 16, size=8.25, leading=10.8,
                       color=NAVY, bold=True)
    p(c, body, x + 8, heading_bottom - 4, w - 16, size=7.55,
      leading=10.0)


def table(c, x, top, widths, header, rows, heights, *, font=8.5):
    total = sum(widths)
    hh = 27
    rect(c, x, top - hh, total, hh, NAVY)
    cx = x
    for col, w in zip(header, widths):
        p(c, col, cx + 7, top - 6, w - 14, size=8.1, leading=10.6,
          color=WHITE, bold=True)
        cx += w
    y = top - hh
    for i, (row, rh) in enumerate(zip(rows, heights)):
        rect(c, x, y - rh, total, rh,
             PALE_TEAL if i == len(rows) - 1 else (WHITE if i % 2 == 0 else PALE_BLUE),
             LINE)
        cx = x
        for j, (cell, w) in enumerate(zip(row, widths)):
            if j:
                line(c, cx, y, cx, y - rh)
            p(c, cell, cx + 7, y - 8, w - 14, size=font,
              leading=font * 1.32, bold=(j == 0),
              color=NAVY if j == 0 else INK)
            cx += w
        y -= rh
    return y


c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
c.setTitle("Corppass Vendor Onboarding & Verification Flow")
c.setAuthor("Project team")
c.setSubject("Plain English vendor company verification flow")

# PAGE 1 — purpose and split of responsibilities
page(c, 1)
label(c, "FUNCTIONAL AREA GUIDE", L, 738, size=9.5, color=TEAL, bold=True)
p(c, "Corppass<br/>Vendor Onboarding &amp;<br/>Verification Flow", L, 718,
  CW, size=22.8, leading=29.8, color=NAVY, bold=True)
p(c, "A simple guide to the company check, the person’s corporate access check, and the approval needed before a vendor account can be used.",
  L, 617, CW, size=10.2, leading=15.2)
line(c, L, 565, R, 565)
y = section(c, "Why verification is needed", 549)
p(c, "A registration form tells us what someone entered. Before granting access, we need to check the company’s official details and confirm that the person is acting for the intended company under the required authorisation.",
  L, y, CW, size=9.7, leading=14.1)

gap = 12
colw = (CW - gap) / 2
card_top = 449
rect(c, L, card_top - 108, colw, 108, PALE_BLUE, LINE)
rect(c, L + colw + gap, card_top - 108, colw, 108, PALE_BLUE, LINE)
label(c, "1  COMPANY", L + 11, card_top - 19, size=8.2, color=TEAL, bold=True)
p(c, "ACRA / BizFile confirms the official company record linked to the submitted UEN.",
  L + 11, card_top - 33, colw - 22, size=9.1, leading=13.4)
label(c, "2  ACTING PERSON", L + colw + gap + 11, card_top - 19,
      size=8.2, color=TEAL, bold=True)
p(c, "Corppass authenticates the user and can provide the entity and authorisation information available to the approved service.",
  L + colw + gap + 11, card_top - 33, colw - 22, size=9.1, leading=13.4)

callout(c, L, 324, CW, 64, "The core rule",
        "The two checks answer different questions. Both must pass the agreed business rules; Terms &amp; Conditions acceptance and GR approval are separate final gates.",
        body_size=8.9)

section(c, "The five-part gate", 238)
segments = [("1", "REGISTER", BLUE), ("2", "ACRA", TEAL),
            ("3", "CORPPASS", NAVY), ("4", "T&C", AMBER),
            ("5", "GR APPROVAL", colors.HexColor("#6d5aa7"))]
segw = CW / 5
for i, (n, name, color) in enumerate(segments):
    x = L + i * segw
    rect(c, x, 162, segw, 54, color)
    c.setFillColor(WHITE)
    c.setFont("DVS-Bold", 9.6)
    c.drawCentredString(x + segw / 2, 194, n)
    c.setFont("DVS-Bold", 6.7)
    c.drawCentredString(x + segw / 2, 174, name)
p(c, "Account access starts only after the required checks, named T&amp;C acceptance, and internal GR decision are complete.",
  L, 146, CW, size=8.7, leading=12.6, color=MUTED)
c.showPage()

# PAGE 2 — checks and fictional example
page(c, 2)
title(c, "1. Two checks, two jobs", "What the vendor does, and what the system checks automatically")

def check_block(top, number, heading, accent, rows, result):
    h = 144
    rect(c, L, top - h, CW, h, WHITE, LINE)
    rect(c, L, top - 32, CW, 32, NAVY)
    label(c, f"{number}  {heading}", L + 11, top - 21, size=10.1,
          color=WHITE, bold=True)
    yy = top - 47
    for who, desc in rows:
        rect(c, L + 10, yy - 18, 62, 19, accent if who == "VENDOR" else PALE_TEAL)
        label(c, who, L + 17, yy - 12, size=7.25,
              color=WHITE if who == "VENDOR" else NAVY, bold=True)
        p(c, desc, L + 82, yy + 1, CW - 93, size=8.7, leading=12.1)
        yy -= 33
    line(c, L + 10, top - 113, R - 10, top - 113)
    p(c, result, L + 11, top - 120, CW - 22, size=8.4, leading=11.5,
      color=MUTED)

check_block(690, "A", "ACRA / BizFile company verification", TEAL,
    [("VENDOR", "Enters the company UEN and registration details."),
     ("SYSTEM", "Uses an authorised ACRA / BizFile service to retrieve available official details and checks the agreed fields." )],
    "Usually automatic in the background. If the record cannot be confirmed, the portal asks for correction or a later retry.")

check_block(530, "B", "Corppass authentication and access", BLUE,
    [("VENDOR", "Clicks “Verify with Corppass”, completes the official sign-in flow, then returns to the portal."),
     ("SYSTEM", "Checks the approved result: transacting entity, authenticated user and required authorisation details, if provided.")],
    "The exact fields, roles and permissions depend on the approved Corppass integration and must be confirmed.")

section(c, "How both checks work together", 364)
p(c, "<b>Fictional example: Harbour Motor Gallery Pte. Ltd.</b> enters an illustrative UEN, <b>201912345A</b>. The authorised ACRA check returns the official company record for that UEN. After Corppass sign-in, the portal compares the submitted UEN with the <b>entity registration number</b> returned for the selected transacting entity, if that field is available in the approved integration.",
  L, 340, CW, size=9.1, leading=13.3)
callout(c, L, 262, CW, 89, "Decision after the comparison",
        "If the numbers match, the portal still checks the required Corppass authorisation before moving on. If they differ, onboarding stops: the vendor corrects the registration or selects the intended entity, then retries. A matching number alone does <b>not</b> prove that the user is an owner or director.",
        body_size=8.55)
p(c, "For Singapore entities, the UEN comparison rule and accepted entity types must be agreed before launch. ACRA and Corppass results are recorded as separate checks.",
  L, 157, CW, size=8.55, leading=12.3, color=MUTED)
c.showPage()

# PAGE 3 — full workflow diagram
page(c, 3)
title(c, "2. Complete workflow", "Teal arrows = continue  |  Side branches = retry or pending")
main_x, main_w = L, 304
side_x, side_w = L + 326, CW - 326
ys = [664, 581, 498, 415, 332, 249, 166]
stages = [
    ("Company Registration", "VENDOR ACTION"),
    ("ACRA Verification", "AUTOMATIC SYSTEM CHECK"),
    ("Corppass Authentication", "VENDOR + OFFICIAL SERVICE"),
    ("UEN Comparison and Required<br/>Authorisation Checks", "AUTOMATIC SYSTEM CHECK"),
    ("T&amp;C Acceptance", "VENDOR ACTION"),
    ("GR Approval", "INTERNAL REVIEWER ACTION"),
    ("Vendor Account Activated", "AUTOMATIC SYSTEM STATE"),
]
for i, (cy, (heading, actor)) in enumerate(zip(ys, stages), start=1):
    stage(c, main_x, cy, main_w, 53, i, heading, actor, final=(i == 7))
    if i < 7:
        arrow_down(c, main_x + main_w / 2, cy - 27, ys[i] + 27)

branch(c, side_x, 581, side_w, 62, "ACRA check failed",
       "Correct company details or retry when the service is available.")
branch(c, side_x, 498, side_w, 62, "Authentication failure",
       "Return to the portal and retry Corppass verification.")
branch(c, side_x, 415, side_w, 65, "UEN mismatch",
       "Stop. Correct the UEN or choose the intended entity, then retry. Resolve missing access.")
branch(c, side_x, 249, side_w, 65, "Pending GR approval",
       "No vendor access while the reviewer decides. Rejection shows a reason and next step.",
       fill=PALE_BLUE, accent=BLUE)
for cy in [581, 498, 415]:
    arrow_right(c, main_x + main_w + 3, side_x - 2, cy, AMBER)
arrow_right(c, main_x + main_w + 3, side_x - 2, 249, BLUE)
label(c, "PASS / CONTINUE", main_x + 169, 622, size=6.9,
      color=TEAL, bold=True)
callout(c, L, 111, CW, 47, "Access gate",
        "Activation requires completed checks, named T&amp;C acceptance and an approved GR decision.",
        body_size=8.2)
c.showPage()

# PAGE 4 — screens and states
page(c, 4)
title(c, "3. Screens and states", "The portal should always show the current result and the next action")
rows = [
    ("Company registration form", "Vendor enters UEN, company and contact details; submits the application.", "Submitted / checking"),
    ("ACRA verification result", "Shows official company match or a clear correction / retry message.", "Verified / needs correction"),
    ("Verify with Corppass", "Button starts the official authentication flow and returns the user to the portal.", "Ready / in progress"),
    ("Verification success or failure", "Shows whether Corppass authentication and required access checks passed; offers retry if allowed.", "Passed / failed"),
    ("UEN mismatch and retry", "Explains that the registered UEN differs from the transacting entity; blocks progress until resolved.", "Mismatch / retry"),
    ("Pending GR approval", "Confirms that checks and terms are complete; states that the internal decision is still pending.", "Pending approval"),
    ("Approved or rejected application", "Shows approval and account access, or rejection with reason and next step.", "Activated / rejected"),
]
table(c, L, 698, [141, 249, CW - 390],
      ["Screen", "What the vendor sees / does", "State"], rows,
      [65, 65, 65, 73, 73, 73, 73], font=8.0)
callout(c, L, 156, CW, 68, "Keep actions and checks distinct",
        "The vendor enters information, starts Corppass and accepts terms. ACRA lookup, returned-entity comparison and final access decision happen in the system. GR approval is an internal reviewer action.",
        body_size=8.7)
c.showPage()

# PAGE 5 — decisions, summary and sources
page(c, 5)
title(c, "4. Decisions to confirm", "These project choices determine what counts as a successful verification")
decision_rows = [
    ("Corppass authorisation", "Which service access, role or other approved authorisation detail must the acting user have? Which returned field proves it?"),
    ("UEN matching", "Which Singapore entity types are in scope? What happens if the submitted UEN and returned entity registration number differ or are unavailable?"),
    ("Retry policy", "How many retries are allowed after ACRA failure, Corppass failure or timeout? When is staff help required?"),
    ("GR approval", "Who is GR, who may approve or reject, and what evidence or reason must be recorded?"),
    ("Terms acceptance", "Who may accept on behalf of the company, and which terms version and date must be retained?"),
    ("Result freshness", "How long are company and authorisation results valid, and when must they be checked again?"),
]
table(c, L, 698, [154, CW - 154], ["Decision", "Question for the project team"],
      decision_rows, [64, 70, 63, 63, 63, 63], font=8.15)
callout(c, L, 250, CW, 74, "One clear rule for go-live",
        "A vendor account becomes active only when the company record is confirmed, the person’s required Corppass authorisation is verified, the named T&amp;C acceptance is recorded, and GR approves the application.",
        body_size=8.8)

line(c, L, 157, R, 157)
p(c, "Reference basis", L, 145, CW, size=8.8, color=BLUE, bold=True)
p(c, "Supplied <i>Corppass Vendor Onboarding &amp; Verification Guide</i>; checked against official ACRA and Corppass documentation on 15 October 2026. Exact service access and returned fields require confirmation for this project.",
  L, 129, CW, size=7.8, leading=11.2, color=MUTED)
sources = [
    ("ACRA API Marketplace", "https://www.acra.gov.sg/resources/eservice-tools-portals/api-marketplace/"),
    ("Corppass standard scopes", "https://docs.corppass.gov.sg/technical-specifications/corppass-authorization-api-fapi-2.0/scopes/corppass-standard-scopes"),
    ("Corppass integration guide", "https://docs.corppass.gov.sg/technical-specifications/corppass-authorization-api-fapi-2.0/integration-guide"),
]
x = L
for i, (name, url) in enumerate(sources):
    c.setFont("DVS", 6.9)
    c.setFillColor(BLUE)
    c.drawString(x, 68, name)
    tw = pdfmetrics.stringWidth(name, "DVS", 6.9)
    c.linkURL(url, (x, 65, x + tw, 78), relative=0)
    x += tw + 13
    if i < 2:
        label(c, "|", x - 8, 68, size=6.9, color=MUTED)
c.showPage()
c.save()
print(OUT)
