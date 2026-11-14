import Image from "next/image";

export const AppLoadingScreen = () => {
  return (
    <div
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-950 dark:bg-[#0b1120] dark:text-white"
      role="status"
      aria-live="polite"
      aria-label="Loading Aaccent E-Learn"
    >
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />

      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-[2rem] border border-blue-400/25 bg-blue-500/5 accent-loader-halo" />
          <div className="absolute inset-2 rounded-[1.6rem] border border-cyan-400/30 accent-loader-orbit" />
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl shadow-blue-950/10 dark:bg-slate-900">
            <Image
              src="/icon.png"
              alt=""
              width={64}
              height={64}
              priority
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
        </div>

        <p className="text-xl font-bold tracking-tight">Aaccent E-Learn</p>
        <p className="mt-1.5 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
          Learn. Practise. Improve.
        </p>

        <div className="mt-7 h-1 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 accent-loader-progress" />
        </div>
        <span className="sr-only">Preparing your learning space…</span>
      </div>
    </div>
  );
};
