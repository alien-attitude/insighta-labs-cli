# Insighta CLI

Terminal client for the Insighta Labs+ platform. Authenticate via GitHub, then query, search, and export demographic profiles from your terminal.

---

## Installation

```bash
npm install -g insighta-cli
```

Or from source:
```bash
git clone <repo>
cd insighta-cli
npm install
npm link       # makes `insighta` available globally
```

---

## Configuration

Set the backend API URL (defaults to production URL):
```bash
export INSIGHTA_API_URL=https://your-backend.vercel.app
```

Credentials are stored at: `~/.insighta/credentials.json`

---

## Commands

### Authentication
```bash
insighta login      # GitHub OAuth (opens browser)
insighta logout     # Clear local credentials
insighta whoami     # Show current user info
```

### Profiles
```bash
# List with filters
insighta profiles list
insighta profiles list --gender male
insighta profiles list --country NG --age-group adult
insighta profiles list --min-age 25 --max-age 40
insighta profiles list --sort-by age --order desc --page 2 --limit 20

# Get single profile
insighta profiles get <uuid>

# Natural language search
insighta profiles search "young males from nigeria"
insighta profiles search "adult women in ghana" --page 2

# Create (admin only)
insighta profiles create --name "Harriet Tubman"

# Export (admin only)
insighta profiles export --format csv
insighta profiles export --format csv --gender male --country NG
```

---

## Token Handling

1. `insighta login` runs the full PKCE OAuth flow and stores both tokens in `~/.insighta/credentials.json`
2. Every API request attaches the access token as `Authorization: Bearer <token>`
3. If a request returns 401 (token expired), the CLI automatically:
   - Calls `POST /auth/refresh` with the stored refresh token
   - Updates credentials with the new token pair
   - Retries the original request transparently
4. If the refresh token is also expired → prompts re-login and exits
