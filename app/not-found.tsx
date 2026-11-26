import Link from "next/link";
export default function NotFound() {
  return <main className="min-h-screen grid place-items-center px-6"><section className="max-w-xl text-center"><p className="text-sm tracking-widest">KRISHI CONNECT 360</p><h1 className="mt-4 text-4xl font-semibold">Page not found</h1><p className="mt-4 text-base opacity-70">The page may have moved or the link may be incorrect.</p><Link className="button button-dark inline-flex mt-8" href="/">Return to home</Link></section></main>;
}
