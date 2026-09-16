import { ShieldCheck } from 'lucide-react';

export default function LocalProcessingNotice() {
  return (
    <div className="border-b border-teal-100 bg-teal-50">
      <div className="mx-auto flex w-full max-w-5xl items-start gap-2.5 px-4 py-2.5 text-sm leading-5 text-teal-950 sm:items-center sm:px-6">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 sm:mt-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Private by design:</span> images are processed locally
          in your browser and never uploaded.
        </p>
      </div>
    </div>
  );
}
