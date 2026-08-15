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
    'Incorrect email or password.',
  );
  assert.equal(
    friendlyAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' }),
    'Please confirm your email first. Check your inbox for the confirmation link.',
  );
});
