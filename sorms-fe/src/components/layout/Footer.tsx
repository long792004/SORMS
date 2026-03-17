export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 text-small dark:border-white/10 dark:bg-slate-950/80">
      <div className="page-shell grid gap-6 text-slate-600 md:grid-cols-4 dark:text-slate-300">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">SORM</p>
          <p className="mt-2">Modern smart resident management platform.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">About</p>
          <p className="mt-2">Company</p>
          <p>Mission</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Contact</p>
          <p className="mt-2">support@sorms.vn</p>
          <p>+84 901 234 567</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Support</p>
          <p className="mt-2">Help Center</p>
          <p>Terms & Privacy</p>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} SORM. All rights reserved.</p>
    </footer>
  );
}
