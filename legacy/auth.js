// auth.js — Better Auth configuration
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import 'dotenv/config';

// Better Auth gets its own pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,

  // Email + password sign-in
  emailAndPassword: {
    enabled: true,
    // Disable public signup — admin creates accounts manually or via invite
    disableSignUp: process.env.DISABLE_SIGNUP === 'true',
  },

  // Session config
  session: {
    expiresIn:        60 * 60 * 24 * 7,   // 7 days
    updateAge:        60 * 60 * 24,        // Refresh if older than 1 day
    cookieCache: {
      enabled:   true,
      maxAge:    5 * 60,                   // Cache session for 5 mins
    },
  },

  // Custom user fields — role for RBAC
  user: {
    additionalFields: {
      role: {
        type:     'string',
        required: false,
        defaultValue: 'readonly',
        // Roles: 'admin' | 'practice_manager' | 'sl_lead' | 'state_manager' | 'readonly'
      },
    },
  },

  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',')
    : ['http://localhost:3000'],

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});
