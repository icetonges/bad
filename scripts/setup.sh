#!/usr/bin/env bash
# fedAnalyst — local dev bootstrap
set -e

echo "==> Checking prerequisites"
command -v node >/dev/null 2>&1 || { echo "Node.js not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm not installed"; exit 1; }

NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18+ required. Found: $(node -v)"
  exit 1
fi

echo "==> Installing dependencies"
npm install

if [ ! -f .env.local ]; then
  echo "==> Copying .env.example to .env.local"
  cp .env.example .env.local
  echo ""
  echo "⚠  Edit .env.local with your API keys before running 'npm run dev'"
  echo ""
  echo "Required:"
  echo "  ANTHROPIC_API_KEY"
  echo "  NEXT_PUBLIC_SUPABASE_URL"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  SUPABASE_SERVICE_ROLE_KEY"
  echo "  VOYAGE_API_KEY (or OPENAI_API_KEY)"
  echo ""
  echo "For contact form:"
  echo "  RESEND_API_KEY + CONTACT_TO_EMAIL"
  echo "  (or GMAIL_USER + GMAIL_APP_PASSWORD)"
  echo ""
fi

echo "==> Bootstrap complete"
echo ""
echo "Next steps:"
echo "  1. Apply supabase/migrations/20260422000000_init.sql to your Supabase project"
echo "  2. Fill in .env.local"
echo "  3. npm run dev"
echo "  4. Open http://localhost:3000"
