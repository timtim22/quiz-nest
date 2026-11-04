var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
/**
 * The audit log: who did what, and when. Any module can inject this and call:
 *
 *   await this.audit.record({ actorId: user.id, action: AuditAction.EXAM_PUBLISHED, entityType: 'Exam', entityId: exam.id });
 */
let AuditService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuditService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new Logger(AuditService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        /** Never throws: if the log can't be written, the error is logged and the action still succeeds. */
        async record(entry) {
            try {
                await this.prisma.auditLog.create({
                    data: {
                        actorId: entry.actorId ?? null,
                        action: entry.action,
                        entityType: entry.entityType,
                        entityId: entry.entityId ?? null,
                        metadata: entry.metadata,
                    },
                });
            }
            catch (error) {
                this.logger.error(`Could not write audit entry ${entry.action}: ${error instanceof Error ? error.message : error}`);
            }
        }
        /** Newest first. */
        async list({ page, pageSize }) {
            const [rows, total] = await this.prisma.$transaction([
                this.prisma.auditLog.findMany({
                    // ids are time-ordered (UUID v7), so they break ties within the same millisecond.
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: { actor: { select: { id: true, name: true, email: true } } },
                }),
                this.prisma.auditLog.count(),
            ]);
            return {
                page,
                pageSize,
                total,
                items: rows.map((row) => ({
                    id: row.id,
                    action: row.action,
                    entityType: row.entityType,
                    entityId: row.entityId,
                    metadata: row.metadata ?? null,
                    actor: row.actor,
                    createdAt: row.createdAt.toISOString(),
                })),
            };
        }
    };
    return AuditService = _classThis;
})();
export { AuditService };
//# sourceMappingURL=audit.service.js.map