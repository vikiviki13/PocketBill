const EMAIL_RATE_LIMIT_CODES = new Set([
  'email_rate_limit_exceeded',
  'over_email_send_rate_limit',
]);

function normalized(value) {
  return String(value ?? '').toLowerCase();
}

export function friendlyAuthError(error, action = 'signin') {
  if (!error) return 'Something went wrong. Please try again.';

  const code = normalized(error.code);
  const message = String(error.message ?? error);
  const normalizedMessage = normalized(message);

  if (code === 'user_already_exists' || normalizedMessage.includes('already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (code === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
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
    return 'Password should be at least 6 characters.';
  }

  return message;
}
