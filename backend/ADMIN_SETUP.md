Initial admin on Render
=======================

Set these in the backend service's Environment Variables before deploying:

- `SEED_ADMIN_EMAIL`: your initial login email.
- `SEED_ADMIN_PASSWORD`: a unique password of 12–72 characters.

Use `npm start` as the Render Start Command. It runs the admin seed before
starting the API. The normal build command stays `npm run build`.

The seed uses the same `DATABASE_URL` (including Aiven certificate parameters)
as the API. It creates an admin only if there are no admin accounts. It does
not add sample products or reset an existing account's password.

After signing in, open Settings → Compte administrateur to change your email
and password. Enter your current password to authorize the change. Leave the
new password fields empty to change only the email.

You can remove the seed variables after the account has been created. If an
admin already exists, these variables will not reset it. A password reset is
a separate operation.

Deploy the frontend changes too, so the account form appears in Settings.
