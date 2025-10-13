# Test Token Deduction

## How to Test:

1. **Check current tokens in navbar** - Should show current token count
2. **Generate a jingle** - Go to `/create` and generate a study set
3. **Check tokens again** - Should decrease by 1
4. **Regenerate a jingle** - In `/my-sets`, regenerate any jingle
5. **Check tokens again** - Should decrease by 1 more
6. **Add more terms** - In flashcard view, add more terms
7. **Check tokens again** - Should decrease by number of terms added

## Expected Behavior:

- **Free users**: Start with 30 tokens, each jingle costs 1 token
- **Basic users**: Start with 300 tokens, each jingle costs 1 token  
- **Premium users**: Unlimited tokens (999999), no deduction

## Debug:

If tokens aren't updating, check:
1. Browser console for token deduction logs
2. Vercel logs for API calls
3. Supabase database for `current_tokens` column updates

## API Endpoints:

- `/api/generate-song` - Deducts token when `userId` is provided and `!existingLyrics`
- `/api/deduct-token` - Standalone token deduction (not used anymore)

## Database:

- Table: `profiles`
- Column: `current_tokens` (INTEGER)
- Updates: `current_tokens = current_tokens - 1`
