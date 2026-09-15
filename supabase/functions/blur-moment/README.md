# blur-moment

Makes the frosted rendition server-side. `index.ts` still imports through
fully-qualified `npm:` specifiers rather than the bare names this `deno.json`
maps, because the deployed function is live and this repo has no egress to
redeploy or test it. The map pins the same two versions in one place; switching
the source to bare specifiers is a safe follow-up for whoever can run
`supabase functions deploy blur-moment` and exercise it.
