export default function Hero({ h1, intro }: { h1: string; intro: string }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-8 text-center sm:px-6 sm:pt-10" data-seo-section>
      <h1 className="text-4xl font-semibold tracking-normal text-gray-900">{h1}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{intro}</p>
    </section>
  );
}
