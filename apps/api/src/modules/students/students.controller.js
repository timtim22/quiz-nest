var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UnauthorizedException, UploadedFile, UseInterceptors, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createStudentSchema, listStudentsQuerySchema, updateStudentSchema, } from '@quiz-nest/shared';
import { StudentsService } from './students.service.js';
import { parseWith } from './students.validation.js';
// STEP 2 (below): paste your login-guard import here
/**
 * Reads the logged-in user from the request.
 * If nobody is logged in, this throws 401, so the routes are safe even before Step 2.
 */
function actorOf(req) {
    const user = req.user;
    if (!user?.id || !user.organizationId)
        throw new UnauthorizedException();
    return { id: user.id, organizationId: user.organizationId };
}
// STEP 2 (below): paste your @UseGuards(...) line here
let StudentsController = (() => {
    let _classDecorators = [Controller('students')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _create_decorators;
    let _importCsv_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _remove_decorators;
    var StudentsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [Get()];
            _create_decorators = [Post()];
            _importCsv_decorators = [Post('import'), UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1024 * 1024 } }))];
            _findOne_decorators = [Get(':id')];
            _update_decorators = [Patch(':id')];
            _remove_decorators = [Delete(':id'), HttpCode(204)];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _importCsv_decorators, { kind: "method", name: "importCsv", static: false, private: false, access: { has: obj => "importCsv" in obj, get: obj => obj.importCsv }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            StudentsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        students = __runInitializers(this, _instanceExtraInitializers);
        constructor(students) {
            this.students = students;
        }
        list(req, query) {
            return this.students.list(actorOf(req), parseWith(listStudentsQuerySchema, query));
        }
        create(req, body) {
            return this.students.create(actorOf(req), parseWith(createStudentSchema, body));
        }
        // Declared before the ":id" routes so "import" is never read as an id.
        importCsv(req, file) {
            if (!file)
                throw new BadRequestException('Attach a CSV file in the "file" field.');
            if (!file.originalname.toLowerCase().endsWith('.csv')) {
                throw new BadRequestException('Only .csv files are supported.');
            }
            return this.students.importCsv(actorOf(req), file.buffer);
        }
        findOne(req, id) {
            return this.students.findOne(actorOf(req), id);
        }
        update(req, id, body) {
            return this.students.update(actorOf(req), id, parseWith(updateStudentSchema, body));
        }
        async remove(req, id) {
            await this.students.remove(actorOf(req), id);
        }
    };
    return StudentsController = _classThis;
})();
export { StudentsController };
//# sourceMappingURL=students.controller.js.map