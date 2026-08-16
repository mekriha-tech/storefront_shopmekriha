import Image from "next/image";

// Drop-in replacement for next/image's `fill` usage that shows a neutral
// placeholder instead of erroring (or silently substituting an unrelated
// photo) when a farm/product has no real uploaded image yet.
export default function MediaImage({ src, alt, className = "", sizes, priority = false }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-1/3 h-1/3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l5.5-5.5a2 2 0 0 1 2.8 0L17 16.5M14 13.5l1.5-1.5a2 2 0 0 1 2.8 0L21 14.5M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}
