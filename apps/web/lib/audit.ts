import { prisma } from './prisma';

export async function createAuditLog(userId: string, action: string, details: any) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details: details || {},
            }
        });
    } catch (error) {
        console.error("Audit Log Error:", error);
    }
}
