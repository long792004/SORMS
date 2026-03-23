export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200/80 bg-white/75 py-10 text-small backdrop-blur-md">
      <div className="page-shell grid gap-6 text-slate-600 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200/70 bg-white/75 p-4">
          <p className="font-heading text-lg font-semibold text-slate-900">SORM</p>
          <p className="mt-2">Modern smart resident management platform with a premium digital experience.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">About</p>
          <p className="mt-2">Company</p>
          <p>Mission</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Contact</p>
          <p className="mt-2">support@sorms.vn</p>
          <p>+84 901 234 567</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Support</p>
          <p className="mt-2">Help Center</p>
          <p>Terms & Privacy</p>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} SORM. All rights reserved.</p>
    </footer>
  );
}
