export default function Footer() {
  return (
    <footer className="border-t py-6 px-6 text-center text-sm text-neutral-600">
      <p>© {new Date().getFullYear()} Polly App. All rights reserved.</p>
    </footer>
  );
}