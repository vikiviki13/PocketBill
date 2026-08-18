import test from 'node:test';
import assert from 'node:assert/strict';
import { friendlyAuthError } from '../src/authErrors.js';

test('email quota errors explain the hourly confirmation-email limit', () => {
  assert.equal(
    friendlyAuthError({
      code: 'over_email_send_rate_limit',
      message: 'Email rate limit exceeded',
      status: 429,
    }, 'signup'),
    'We could not send the confirmation email because the email service has reached its hourly limit. Please try again later.',
  );
});

test('general rate limits are described according to the auth action', () => {
  assert.equal(
    friendlyAuthError({ message: 'Request rate limit reached', status: 429 }, 'signup'),
    'Too many sign-up requests were received. Please wait a few minutes and try again.',
  );
  assert.equal(
    friendlyAuthError({ message: 'Request rate limit reached', status: 429 }, 'signin'),
    'Too many sign-in requests were received. Please wait a few minutes and try again.',
  );
});

test('common authentication errors remain user friendly', () => {
  assert.equal(
    friendlyAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
    'Email or password is incorrect.',
  );
  assert.equal(
    friendlyAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' }),
    'Please confirm your email first. Check your inbox for the confirmation link.',
  );
});

test('existing accounts and weak passwords guide the user back', () => {
  assert.equal(
    friendlyAuthError({ code: 'user_already_exists', message: 'User already registered' }, 'signup'),
    'An account already exists for this email. Sign in instead.',
  );
  assert.equal(
    friendlyAuthError({ code: 'weak_password', message: 'Password should be at least 6 characters' }, 'signup'),
    'Password must contain at least 8 characters.',
  );
});

test('network failures are explained without technical jargon', () => {
  assert.equal(
    friendlyAuthError(new TypeError('Failed to fetch'), 'signin'),
    'Unable to sign in. Check your connection and try again.',
  );
  assert.equal(
    friendlyAuthError({ message: 'Network request failed' }, 'signup'),
    'Unable to create your account. Check your connection and try again.',
  );
  assert.equal(
    friendlyAuthError({ message: 'Failed to fetch' }, 'forgot'),
    'Unable to send the recovery link. Check your connection and try again.',
  );
});
