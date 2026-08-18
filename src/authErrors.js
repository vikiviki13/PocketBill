const EMAIL_RATE_LIMIT_CODES = new Set([
  'email_rate_limit_exceeded',
  'over_email_send_rate_limit',
]);

const NETWORK_MESSAGES = {
  signin: 'Unable to sign in. Check your connection and try again.',
  signup: 'Unable to create your account. Check your connection and try again.',
  forgot: 'Unable to send the recovery link. Check your connection and try again.',
  reset: 'Unable to update your password. Check your connection and try again.',
};

function normalized(value) {
  return String(value ?? '').toLowerCase();
}

function isNetworkError(error) {
  if (error instanceof TypeError) return true;
  const message = normalized(error?.message ?? error);
  return message.includes('failed to fetch')
    || message.includes('fetch failed')
    || message.includes('networkerror')
    || message.includes('network request failed')
    || message.includes('load failed');
}

export function friendlyAuthError(error, action = 'signin') {
  if (!error) return 'Something went wrong. Please try again.';

  const code = normalized(error.code);
  const message = String(error.message ?? error);
  const normalizedMessage = normalized(message);

  if (code === 'user_already_exists' || normalizedMessage.includes('already registered')) {
    return 'An account already exists for this email. Sign in instead.';
  }
  if (code === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (code === 'email_not_confirmed' || normalizedMessage.includes('email not confirmed')) {
    return 'Please confirm your email first. Check your inbox for the confirmation link.';
  }
  if (EMAIL_RATE_LIMIT_CODES.has(code) || normalizedMessage.includes('email rate limit')) {
    return 'We could not send the confirmation email because the email service has reached its hourly limit. Please try again later.';
  }
  if (error.status === 429 || code.includes('rate_limit') || normalizedMessage.includes('rate limit')) {
    return action === 'signup'
      ? 'Too many sign-up requests were received. Please wait a few minutes and try again.'
      : 'Too many sign-in requests were received. Please wait a few minutes and try again.';
  }
  if (code === 'weak_password' || normalizedMessage.includes('password should be')) {
    return 'Password must contain at least 8 characters.';
  }
  if (isNetworkError(error)) {
    return NETWORK_MESSAGES[action] || 'Unable to reach PocketBill. Check your connection and try again.';
  }

  return message;
}