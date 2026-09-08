export default function Hero({ h1, intro }: { h1: string; intro: string }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-10 text-center sm:px-6 sm:pt-14" data-seo-section>
      <h1 className="text-3xl font-semibold tracking-normal text-gray-900 sm:text-4xl">{h1}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-gray-600">{intro}</p>
    </section>
  );
}
