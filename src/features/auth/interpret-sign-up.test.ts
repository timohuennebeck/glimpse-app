import { interpretSignUp, type SignUpResponseLike } from '@/features/auth/interpret-sign-up';

const response = (
  over: Partial<SignUpResponseLike['data']> = {},
  error: SignUpResponseLike['error'] = null,
) => ({
  data: { user: null, session: null, ...over },
  error,
});

describe('interpretSignUp', () => {
  it('is signed in when the response carries both a user and a session', () => {
    expect(interpretSignUp(response({ user: { id: 'u1', identities: [{}] }, session: {} }))).toEqual({
      kind: 'signed-in',
      userId: 'u1',
    });
  });

  it('reads an empty identities array as an address that already has an account', () => {
    expect(interpretSignUp(response({ user: { id: 'u1', identities: [] } }))).toEqual({
      kind: 'already-registered',
    });
  });

  it('reads a user without a session as email confirmation still being on', () => {
    expect(interpretSignUp(response({ user: { id: 'u1', identities: [{}] } }))).toEqual({
      kind: 'confirmation-required',
    });
  });

  it('reads the already-registered error code', () => {
    expect(interpretSignUp(response({}, { code: 'user_already_exists', message: 'whatever' }))).toEqual({
      kind: 'already-registered',
    });
  });

  it('reads the already-registered message when there is no code', () => {
    expect(interpretSignUp(response({}, { message: 'User already registered' }))).toEqual({
      kind: 'already-registered',
    });
  });

  it('rethrows anything else, so the form can show it', () => {
    expect(() => interpretSignUp(response({}, { message: 'Password is too short' }))).toThrow();
  });
});
