import PublicLayout from '../components/PublicLayout.jsx';

export default function ContactPage() {
  return (
    <PublicLayout title="Contact" subtitle="Reach school administration or system support.">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p>
          <span className="font-semibold text-slate-900">Email:</span> support@school.local
        </p>
        <p>
          <span className="font-semibold text-slate-900">Phone:</span> +91-00000-00000
        </p>
        <p>
          <span className="font-semibold text-slate-900">Hours:</span> Monday to Saturday, 9:00 AM to 5:00 PM
        </p>
      </div>
      <p className="leading-7">Include your full name, username, role, and issue details for faster help.</p>
    </PublicLayout>
  );
}
