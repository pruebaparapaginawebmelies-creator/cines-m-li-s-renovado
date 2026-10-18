<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Prices and cinema list live only in src/lib/cinema.ts; server recomputes booking totals there so the client can't change prices.
- Bookings are name + ticket count only (no seat map, no online payment; paid at the box office). They are written only through the createBooking server fn (admin client); the public has no direct table access to bookings.
- Booking notifications go through the Gmail connector for now (test phase); the recipient constant is in cartelera.functions.ts.
- Showtimes are stored in UTC and always displayed/entered in Europe/Madrid time.
- The first account that signs up becomes admin (DB trigger); later accounts get no permissions.
