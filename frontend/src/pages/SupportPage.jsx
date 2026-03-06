import PublicLayout from '../components/PublicLayout.jsx';
import { useSEO } from '../components/SEO.jsx';

export default function SupportPage() {
  useSEO({
    title: 'Support',
    description: 'Get support for login, grades, and technical issues in the MS Piparda School Management System.',
    path: '/support',
    robots: 'index,follow'
  });

  return (
    <PublicLayout title="Support" subtitle="Quick help for login, grades, and technical issues.">
      <ul className="list-disc space-y-2 pl-5">
        <li className="leading-7">Login issues: verify username/password and contact admin for reset.</li>
        <li className="leading-7">Grade issues: confirm exam/test publication and check with your teacher.</li>
        <li className="leading-7">Technical issues: refresh, clear cache, or try a different browser.</li>
      </ul>
      <p className="leading-7">If problems continue, use the contact page and include your role and username.</p>
    </PublicLayout>
  );
}
