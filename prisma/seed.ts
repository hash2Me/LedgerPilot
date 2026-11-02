import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting LedgerPilot database seeding...");

  // Clean existing demo data if re-running
  const existingFirm = await prisma.firm.findUnique({
    where: { slug: "apex-cpa" },
  });

  if (existingFirm) {
    console.log("ℹ️ Existing demo firm found. Deleting old demo records...");
    await prisma.firm.delete({ where: { id: existingFirm.id } });
  }

  // 1. Create Demo Accounting Firm
  console.log("🏢 Creating firm: Apex Accounting Partners...");
  const firm = await prisma.firm.create({
    data: {
      name: "Apex Accounting Partners",
      slug: "apex-cpa",
      billingTier: "PRO",
    },
  });

  // 2. Hash common password
  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 3. Create Users
  console.log("👥 Creating users (Admin, Accountant, Client)...");
  const adminUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      fullName: "Sarah Jenkins, CPA",
      email: "partner@apexcpa.com",
      role: "ADMIN",
      hashedPassword: defaultPassword,
    },
  });

  const staffAccountant = await prisma.user.create({
    data: {
      firmId: firm.id,
      fullName: "Marcus Vance",
      email: "accountant@apexcpa.com",
      role: "ACCOUNTANT",
      hashedPassword: defaultPassword,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      fullName: "Alex Mercer",
      email: "alex@nexusdynamics.io",
      role: "CLIENT",
      hashedPassword: defaultPassword,
    },
  });

  // 4. Create Clients
  console.log("📁 Creating clients...");
  const nexusDynamics = await prisma.client.create({
    data: {
      firmId: firm.id,
      companyName: "Nexus Dynamics LLC",
      taxEntity: "S_CORP",
      einTaxId: "12-3456789",
      status: "ACTIVE",
      assignedUserId: staffAccountant.id,
    },
  });

  const blueHarbor = await prisma.client.create({
    data: {
      firmId: firm.id,
      companyName: "Blue Harbor Logistics Inc",
      taxEntity: "C_CORP",
      einTaxId: "98-7654321",
      status: "ACTIVE",
      assignedUserId: adminUser.id,
    },
  });

  const greenLeaf = await prisma.client.create({
    data: {
      firmId: firm.id,
      companyName: "Green Leaf Organics",
      taxEntity: "SOLE_PROP",
      einTaxId: "45-6789012",
      status: "ONBOARDING",
      assignedUserId: staffAccountant.id,
    },
  });

  // 5. Create Invoices with Line Items
  console.log("🧾 Creating sample invoices & line items...");

  // Pending Invoice: AWS
  await prisma.invoice.create({
    data: {
      clientId: nexusDynamics.id,
      uploadedById: staffAccountant.id,
      invoiceNumber: "INV-AWS-2026-891",
      vendorName: "Amazon Web Services, Inc.",
      transactionDate: new Date("2026-10-18"),
      subtotal: new Prisma.Decimal("1300.00"),
      taxAmount: new Prisma.Decimal("120.50"),
      totalAmount: new Prisma.Decimal("1420.50"),
      currency: "USD",
      category: "Software & Cloud Services",
      fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000",
      stagingStatus: "PENDING",
      aiRawResponse: JSON.stringify({
        confidenceScore: 96,
        model: "gpt-4o",
        notes: "High confidence extraction; verified against AWS billing format",
      }),
      items: {
        create: [
          {
            description: "Amazon EC2 Elastic Compute Cloud (us-east-1)",
            quantity: 1,
            unitPrice: new Prisma.Decimal("850.00"),
            amount: new Prisma.Decimal("850.00"),
          },
          {
            description: "Amazon Simple Storage Service (S3 Standard)",
            quantity: 1,
            unitPrice: new Prisma.Decimal("250.00"),
            amount: new Prisma.Decimal("250.00"),
          },
          {
            description: "Amazon Relational Database Service (RDS Postgres)",
            quantity: 1,
            unitPrice: new Prisma.Decimal("200.00"),
            amount: new Prisma.Decimal("200.00"),
          },
        ],
      },
    },
  });

  // Approved Invoice: Office Supplies
  await prisma.invoice.create({
    data: {
      clientId: blueHarbor.id,
      uploadedById: adminUser.id,
      invoiceNumber: "STP-94821",
      vendorName: "Staples Business Depot",
      transactionDate: new Date("2026-10-12"),
      subtotal: new Prisma.Decimal("227.59"),
      taxAmount: new Prisma.Decimal("18.21"),
      totalAmount: new Prisma.Decimal("245.80"),
      currency: "USD",
      category: "Office Supplies",
      fileUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000",
      stagingStatus: "APPROVED",
      items: {
        create: [
          {
            description: "Multipurpose Copy Paper (10 Reams)",
            quantity: 2,
            unitPrice: new Prisma.Decimal("45.99"),
            amount: new Prisma.Decimal("91.98"),
          },
          {
            description: "High-Yield Black Toner Cartridge",
            quantity: 1,
            unitPrice: new Prisma.Decimal("135.61"),
            amount: new Prisma.Decimal("135.61"),
          },
        ],
      },
    },
  });

  // Rejected Invoice: Disallowed Expense
  await prisma.invoice.create({
    data: {
      clientId: greenLeaf.id,
      uploadedById: staffAccountant.id,
      invoiceNumber: "RES-7721",
      vendorName: "Highland Luxury Resort & Spa",
      transactionDate: new Date("2026-10-05"),
      subtotal: new Prisma.Decimal("3450.00"),
      taxAmount: new Prisma.Decimal("350.00"),
      totalAmount: new Prisma.Decimal("3800.00"),
      currency: "USD",
      category: "Personal Expense / Disallowed",
      fileUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
      stagingStatus: "REJECTED",
      items: {
        create: [
          {
            description: "Weekend Luxury Villa Booking",
            quantity: 1,
            unitPrice: new Prisma.Decimal("3450.00"),
            amount: new Prisma.Decimal("3450.00"),
          },
        ],
      },
    },
  });

  // 6. Create Voice Notes
  console.log("🎙️ Creating voice notes...");
  await prisma.voiceNote.create({
    data: {
      clientId: nexusDynamics.id,
      userId: staffAccountant.id,
      audioUrl: "https://example.com/audio/nexus-q3-memo.mp3",
      transcription:
        "Met with Alex today to review Nexus Dynamics Q3 expenditure. They spent roughly $45,000 on new proprietary algorithm development which qualifies under the Section 41 R&D tax credit. We need to collect their engineer time-tracking logs before year end. Also discussed their estimated quarterly tax payment for Q4.",
      billableHours: new Prisma.Decimal("0.75"),
      structuredSummary: {
        summary: "Q3 financial consultation covering Section 41 R&D tax credit qualification and Q4 estimated tax filing schedule.",
        topics: ["R&D Tax Credit (Section 41)", "Software Capitalization", "Q4 Estimated Payments"],
        actionItems: [
          {
            task: "Request engineer payroll and sprint logs from Nexus CTO",
            assignee: "ACCOUNTANT",
            priority: "HIGH",
            dueDate: "2026-11-15",
          },
          {
            task: "Send Q4 estimated tax payment voucher to Alex Mercer",
            assignee: "ACCOUNTANT",
            priority: "MEDIUM",
            dueDate: "2026-12-01",
          },
        ],
        taxNotes: [
          "Expenditures under software R&D meet Section 41 4-part test criteria",
          "Ensure Form 6765 documentation is prepared ahead of March 15 deadline",
        ],
        suggestedBillableMinutes: 45,
      },
    },
  });

  // 7. Create Document Requests
  console.log("📋 Creating document requests...");
  await prisma.documentRequest.create({
    data: {
      clientId: nexusDynamics.id,
      requestedById: staffAccountant.id,
      title: "2026 Q3 Payroll Summary & 1099 Contractor Roster",
      description: "Please upload your complete Gusto/ADP payroll journal along with SSN/EIN details for any new independent contractors paid >$600.",
      status: "REQUESTED",
      dueDate: new Date("2026-11-20"),
    },
  });

  await prisma.documentRequest.create({
    data: {
      clientId: blueHarbor.id,
      requestedById: adminUser.id,
      title: "Silicon Valley Bank September Statement",
      description: "End of month statement needed for bank reconciliation balance sheet matching.",
      status: "SUBMITTED",
      dueDate: new Date("2026-10-31"),
      submittedFileUrl: "https://example.com/docs/svb-september-2026.pdf",
    },
  });

  console.log("✨ Seeding completed successfully!");
  console.log("\n========================================================");
  console.log("🔑 Demo Credentials for Login:");
  console.log("  • Admin CPA:       partner@apexcpa.com    / Password123!");
  console.log("  • Staff:           accountant@apexcpa.com / Password123!");
  console.log("  • Client Portal:   alex@nexusdynamics.io  / Password123!");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
