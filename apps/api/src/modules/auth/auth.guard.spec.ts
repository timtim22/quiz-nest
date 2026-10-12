import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@quiz-nest/shared';
import { AuthGuard } from './auth.guard.js';
import type { AccessTokenPayload } from './auth.types.js';

const SECRET = 'unit-test-secret-that-is-at-least-32-chars';

function contextFor(request: object): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const reflector = { getAllAndOverride: vi.fn() };
  const guard = new AuthGuard(jwt, reflector as unknown as Reflector);
  const payload: AccessTokenPayload = { sub: 'user-1', role: 'TEACHER', org: 'org-1' };

  beforeEach(() => {
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('lets @Public() routes through without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(true);
  });

  it('puts the user on the request for a valid token', async () => {
    const request = { headers: { authorization: `Bearer ${await jwt.signAsync(payload)}` } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request).toMatchObject({
      user: { id: 'user-1', role: 'TEACHER', organizationId: 'org-1' },
    });
  });

  it('rejects a missing token', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
    });
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new JwtService({
      secret: 'some-other-secret-of-32-characters!!',
    }).signAsync(payload);

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${forged}` } })),
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHORIZED });
  });

  it('rejects an expired token', async () => {
    const expired = await jwt.signAsync(payload, { expiresIn: -10 });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${expired}` } })),
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHORIZED });
  });
});
