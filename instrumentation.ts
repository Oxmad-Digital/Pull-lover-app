export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Happy Eyeballs (parallel IPv4/IPv6 connection racing) intermittently
    // fails "fetch failed" against Neon when the host advertises IPv6 (AAAA
    // records) but has no real IPv6 route — a common setup on dev machines
    // and serverless runtimes. Forcing plain IPv4-first connections fixes it.
    const { setDefaultAutoSelectFamily } = await import("node:net");
    setDefaultAutoSelectFamily(false);
  }
}
