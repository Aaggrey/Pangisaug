export function HeroSlider() {
  return (
    <div className="relative h-[280px] w-full overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 sm:h-[320px]">
      <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6">
        <div className="animate-fade-in space-y-3 text-center">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            Trusted Ugandan Property Directory
          </span>
          <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">
            Houses & Apartments for Rent in Kampala/Uganda
          </h1>
          <p className="text-lg font-semibold text-brand-100">Affordable Rentals</p>
        </div>
      </div>
    </div>
  );
}