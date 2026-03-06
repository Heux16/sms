import PublicLayout from '../components/PublicLayout.jsx';
import { useSEO } from '../components/SEO.jsx';

export default function ContactPage() {
  useSEO({
    title: 'Contact',
    description: 'Contact school administration and system support for the MS Piparda School Management System.',
    path: '/contact',
    robots: 'index,follow'
  });

  return (
    <PublicLayout title="Contact" subtitle="Reach school administration or system support.">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p>
          <span className="font-semibold text-slate-900">Email:</span> harshdadsena6@gmail.com
        </p>
        <p>
          <span className="font-semibold text-slate-900">Phone:</span> +91-97556-18816
        </p>
        <p>
          <span className="font-semibold text-slate-900">Hours:</span> Monday to Saturday, 6:00 PM to 2:00 AM
        </p>
      </div>
      <p className="leading-7">Include your full name, username, role, and issue details for faster help.</p>
    </PublicLayout>
  );
}
