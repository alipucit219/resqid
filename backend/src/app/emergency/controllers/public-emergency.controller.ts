import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "src/shared/decorators/is-public.decorator";
import type { Response } from "express";
import { EmergencyAccessService } from "../services/emergency-access.service";

@ApiTags("Emergency Access")
@Controller("emergency-access")
export class PublicEmergencyController {
  constructor(private readonly emergencyAccessService: EmergencyAccessService) {}

  private renderValue(value: unknown, fallback = "Not set") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  private renderList(items: unknown, fallback = "None") {
    if (!Array.isArray(items) || items.length === 0) {
      return fallback;
    }

    const values = items
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);

    return values.length > 0 ? values.join(", ") : fallback;
  }

  private escapeHtml(value: unknown) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  @Public()
  @ApiOperation({ summary: "Resolve emergency profile JSON from public token" })
  @Get(":token/data")
  async getEmergencyProfileFromTokenData(@Param("token") token: string) {
    return await this.emergencyAccessService.resolvePublicToken(token);
  }

  @Public()
  @ApiOperation({ summary: "Render emergency profile page from public token" })
  @Get(":token")
  async getEmergencyProfileFromToken(
    @Param("token") token: string,
    @Res() res: Response,
  ) {
    const data = await this.emergencyAccessService.resolvePublicToken(token);
    const identity: any = data.identityDetails || {};
    const profile: any = data.medicalProfile || {};
    const summary: any = data.medicalSummary || {};
    const highlights: any = data.profileHighlights || {};
    const contacts = Array.isArray(data.emergencyContacts)
      ? data.emergencyContacts
      : [];

    const contactRows =
      contacts.length > 0
        ? contacts
            .map(
              (contact) => `
                <div class="contact">
                  <div class="contact-name">${this.escapeHtml(this.renderValue(contact?.name, "Unknown contact"))}</div>
                  <div class="contact-line">${this.escapeHtml(this.renderValue(contact?.phoneNumber))}</div>
                  <div class="contact-line">${this.escapeHtml(this.renderValue(contact?.relationship, "No relationship"))}</div>
                </div>
              `,
            )
            .join("")
        : `<p class="muted">No emergency contacts available.</p>`;

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RESQID Emergency Profile</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #fff7f5;
        --card: #ffffff;
        --text: #172033;
        --muted: #62708a;
        --accent: #d14343;
        --accent-soft: #ffe5e5;
        --line: #f1d5d5;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, #ffe7d6, transparent 30%),
          linear-gradient(180deg, #fff8f3 0%, #fff 100%);
        color: var(--text);
      }
      .page {
        max-width: 860px;
        margin: 0 auto;
        padding: 24px 16px 40px;
      }
      .hero, .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(209, 67, 67, 0.08);
      }
      .hero {
        padding: 24px;
        margin-bottom: 16px;
      }
      .eyebrow {
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      h1 {
        margin: 14px 0 6px;
        font-size: 32px;
        line-height: 1.1;
      }
      .subtitle, .muted, .line {
        color: var(--muted);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .card {
        padding: 20px;
      }
      h2 {
        margin: 0 0 14px;
        font-size: 18px;
      }
      .line {
        margin: 8px 0;
        font-size: 15px;
      }
      .line strong {
        color: var(--text);
      }
      .contact {
        border: 1px solid #e8eef8;
        border-radius: 16px;
        padding: 12px 14px;
        background: #f9fbff;
      }
      .contact + .contact {
        margin-top: 10px;
      }
      .contact-name {
        font-weight: 800;
        margin-bottom: 4px;
      }
      .contact-line {
        color: var(--muted);
        font-size: 14px;
        margin-top: 3px;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="eyebrow">Emergency Medical Profile</div>
        <h1>${this.escapeHtml(this.renderValue(data.user?.fullName, "Unknown User"))}</h1>
        <p class="subtitle">This emergency profile was opened from a RESQID QR code.</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>Identity Details</h2>
          <p class="line"><strong>Full Name:</strong> ${this.escapeHtml(this.renderValue(identity.fullName, data.user?.fullName || "Unknown User"))}</p>
          <p class="line"><strong>Email:</strong> ${this.escapeHtml(this.renderValue(identity.email))}</p>
          <p class="line"><strong>Phone Number:</strong> ${this.escapeHtml(this.renderValue(identity.phoneNumber))}</p>
          <p class="line"><strong>CNIC:</strong> ${this.escapeHtml(this.renderValue(identity.cnic))}</p>
          <p class="line"><strong>Address:</strong> ${this.escapeHtml(this.renderValue(identity.address))}</p>
          <p class="line"><strong>Date of Birth:</strong> ${this.escapeHtml(this.renderValue(identity.dateOfBirth))}</p>
          <p class="line"><strong>Gender:</strong> ${this.escapeHtml(this.renderValue(identity.gender))}</p>
        </article>

        <article class="card">
          <h2>Medical Profile</h2>
          <p class="line"><strong>Blood Group:</strong> ${this.escapeHtml(this.renderValue(profile.bloodGroup))}</p>
          <p class="line"><strong>CNIC:</strong> ${this.escapeHtml(this.renderValue(profile.cnic))}</p>
          <p class="line"><strong>Age:</strong> ${this.escapeHtml(this.renderValue(profile.age))}</p>
          <p class="line"><strong>Address:</strong> ${this.escapeHtml(this.renderValue(profile.address))}</p>
          <p class="line"><strong>Gender:</strong> ${this.escapeHtml(this.renderValue(profile.gender))}</p>
          <p class="line"><strong>Allergies:</strong> ${this.escapeHtml(this.renderList(profile.allergies))}</p>
          <p class="line"><strong>Conditions:</strong> ${this.escapeHtml(this.renderList(profile.chronicConditions))}</p>
          <p class="line"><strong>Medications:</strong> ${this.escapeHtml(this.renderList(profile.medications))}</p>
          <p class="line"><strong>Emergency Notes:</strong> ${this.escapeHtml(this.renderValue(profile.emergencyNotes))}</p>
        </article>

        <article class="card">
          <h2>Treatment Summary</h2>
          <p class="line"><strong>Hospital:</strong> ${this.escapeHtml(this.renderValue(summary.hospitalName))}</p>
          <p class="line"><strong>Doctor:</strong> ${this.escapeHtml(this.renderValue(summary.doctorName))}</p>
          <p class="line"><strong>Disease Start Year:</strong> ${this.escapeHtml(this.renderValue(summary.diseaseStartingYear))}</p>
          <p class="line"><strong>Duration:</strong> ${this.escapeHtml(this.renderValue(summary.treatmentDuration))}</p>
          <p class="line"><strong>Status:</strong> ${this.escapeHtml(this.renderValue(summary.treatmentStatus))}</p>
          <p class="line"><strong>Current Medications:</strong> ${this.escapeHtml(this.renderList(summary.currentMedications))}</p>
          <p class="line"><strong>Notes:</strong> ${this.escapeHtml(this.renderValue(summary.notes))}</p>
        </article>

        <article class="card">
          <h2>Profile Highlights</h2>
          <p class="line"><strong>Blood Group:</strong> ${this.escapeHtml(this.renderValue(highlights.bloodGroup))}</p>
          <p class="line"><strong>Allergies:</strong> ${this.escapeHtml(this.renderList(highlights.allergies))}</p>
          <p class="line"><strong>Medications:</strong> ${this.escapeHtml(this.renderList(highlights.medications))}</p>
          <p class="line"><strong>Treatment Status:</strong> ${this.escapeHtml(this.renderValue(highlights.treatmentStatus))}</p>
          <p class="line"><strong>Primary Contact:</strong> ${this.escapeHtml(this.renderValue(highlights.primaryEmergencyContact ? `${highlights.primaryEmergencyContact.name} (${highlights.primaryEmergencyContact.phoneNumber})` : null))}</p>
          <p class="line"><strong>Emergency Notes:</strong> ${this.escapeHtml(this.renderValue(highlights.emergencyNotes))}</p>
        </article>

        <article class="card">
          <h2>Emergency Contacts</h2>
          ${contactRows}
        </article>
      </section>
    </main>
  </body>
</html>`;

    return res.type("html").send(html);
  }
}
