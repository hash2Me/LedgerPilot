import { prisma } from "@/lib/prisma";
import { CreateInvoiceInput, UpdateInvoiceStagingInput, StagingStatusEnum } from "@/lib/validations/invoice.schema";
import { Prisma } from "@prisma/client";
import { z } from "zod";

type StagingStatus = z.infer<typeof StagingStatusEnum>;

export class InvoiceService {
  /**
   * List invoices across the firm with pagination & status filters
   */
  static async getInvoices(
    firmId: string,
    options?: {
      clientId?: string;
      stagingStatus?: StagingStatus;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      client: { firmId },
      ...(options?.clientId ? { clientId: options.clientId } : {}),
      ...(options?.stagingStatus ? { stagingStatus: options.stagingStatus } : {}),
      ...(options?.search
        ? {
            OR: [
              { vendorName: { contains: options.search, mode: "insensitive" } },
              { invoiceNumber: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: "desc" },
        include: {
          client: {
            select: { id: true, companyName: true, taxEntity: true },
          },
          items: true,
          uploadedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    return {
      invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID with client verification
   */
  static async getInvoiceById(id: string, firmId: string) {
    return prisma.invoice.findFirst({
      where: {
        id,
        client: { firmId },
      },
      include: {
        client: true,
        items: true,
        uploadedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Create new invoice in PENDING staging status with line items
   */
  static async createInvoice(input: CreateInvoiceInput, uploadedById: string) {
    return prisma.invoice.create({
      data: {
        clientId: input.clientId,
        uploadedById,
        invoiceNumber: input.invoiceNumber || null,
        vendorName: input.vendorName,
        transactionDate: input.transactionDate,
        subtotal: new Prisma.Decimal(input.subtotal),
        taxAmount: new Prisma.Decimal(input.taxAmount),
        totalAmount: new Prisma.Decimal(input.totalAmount),
        currency: input.currency,
        category: input.category || null,
        fileUrl: input.fileUrl,
        stagingStatus: input.stagingStatus,
        aiRawResponse: input.aiRawResponse || null,
        items: {
          create: input.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            amount: new Prisma.Decimal(item.amount),
          })),
        },
      },
      include: {
        items: true,
        client: true,
      },
    });
  }

  /**
   * Commit, reject, or edit an invoice in the staging workflow
   */
  static async updateStagingStatus(
    id: string,
    firmId: string,
    status: StagingStatus,
    updates?: UpdateInvoiceStagingInput
  ) {
    const existing = await prisma.invoice.findFirst({
      where: { id, client: { firmId } },
      include: { items: true },
    });

    if (!existing) {
      throw new Error("Invoice not found or unauthorized");
    }

    // Execute atomic update
    return prisma.$transaction(async (tx) => {
      // Update line items if provided
      if (updates?.items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceItem.createMany({
          data: updates.items.map((item) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            amount: new Prisma.Decimal(item.amount),
          })),
        });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          stagingStatus: status,
          ...(updates?.category !== undefined ? { category: updates.category } : {}),
          ...(updates?.vendorName ? { vendorName: updates.vendorName } : {}),
          ...(updates?.totalAmount !== undefined
            ? { totalAmount: new Prisma.Decimal(updates.totalAmount) }
            : {}),
          ...(updates?.subtotal !== undefined
            ? { subtotal: new Prisma.Decimal(updates.subtotal) }
            : {}),
          ...(updates?.taxAmount !== undefined
            ? { taxAmount: new Prisma.Decimal(updates.taxAmount) }
            : {}),
        },
        include: {
          items: true,
          client: true,
        },
      });
    });
  }
}
