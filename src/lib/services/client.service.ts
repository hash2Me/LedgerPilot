import { prisma } from "@/lib/prisma";
import { CreateClientInput, UpdateClientInput, ClientFilterInput } from "@/lib/validations/client.schema";
import { Prisma } from "@prisma/client";

export class ClientService {
  /**
   * Retrieve list of clients for a firm with optional filtering and pagination
   */
  static async getClients(firmId: string, filters?: ClientFilterInput) {
    const where: Prisma.ClientWhereInput = {
      firmId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.taxEntity ? { taxEntity: filters.taxEntity } : {}),
      ...(filters?.search
        ? {
            OR: [
              { companyName: { contains: filters.search, mode: "insensitive" } },
              { einTaxId: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedUser: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: {
              invoices: true,
              voiceNotes: true,
              documentRequests: true,
            },
          },
        },
      }),
    ]);

    return {
      clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve single client with full relationships
   */
  static async getClientById(id: string, firmId: string) {
    return prisma.client.findFirst({
      where: { id, firmId },
      include: {
        assignedUser: {
          select: { id: true, fullName: true, email: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        documentRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        voiceNotes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  /**
   * Create a new client within a firm
   */
  static async createClient(firmId: string, input: CreateClientInput) {
    return prisma.client.create({
      data: {
        firmId,
        companyName: input.companyName,
        taxEntity: input.taxEntity,
        einTaxId: input.einTaxId || null,
        status: input.status,
        assignedUserId: input.assignedUserId || null,
      },
    });
  }

  /**
   * Update client details
   */
  static async updateClient(id: string, firmId: string, input: Partial<UpdateClientInput>) {
    // Verify client belongs to firm
    const existing = await prisma.client.findFirst({
      where: { id, firmId },
    });

    if (!existing) {
      throw new Error("Client not found or does not belong to this firm");
    }

    return prisma.client.update({
      where: { id },
      data: {
        ...(input.companyName ? { companyName: input.companyName } : {}),
        ...(input.taxEntity ? { taxEntity: input.taxEntity } : {}),
        ...(input.einTaxId !== undefined ? { einTaxId: input.einTaxId || null } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId || null } : {}),
      },
    });
  }

  /**
   * Summary metrics for dashboard
   */
  static async getFirmStats(firmId: string) {
    const [totalClients, activeClients, pendingInvoices, totalVoiceNotes] = await Promise.all([
      prisma.client.count({ where: { firmId } }),
      prisma.client.count({ where: { firmId, status: "ACTIVE" } }),
      prisma.invoice.count({
        where: {
          client: { firmId },
          stagingStatus: "PENDING",
        },
      }),
      prisma.voiceNote.count({
        where: { client: { firmId } },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      pendingInvoices,
      totalVoiceNotes,
    };
  }
}
