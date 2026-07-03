// placeholder until the auth phase wires this to the api
export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <img src="/mark.png" alt="" className="h-9 w-9 object-contain" />
          <div>
            <div className="font-display text-2xl font-semibold tracking-wide">omnes</div>
            <div className="microlabel">Inventory</div>
          </div>
        </div>
        <div className="rule rounded-lg border bg-raised/60 p-6">
          <h1 className="font-display text-xl font-medium uppercase tracking-wide">Sign in</h1>
          <p className="mt-2 text-sm text-bone/50">
            Auth lands in the next phase. This screen is the routing shell.
          </p>
        </div>
      </div>
    </div>
  );
}
