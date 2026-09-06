import Image from 'next/image';

export default function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Cleeke logo"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
}
