import PublicLayout from '../components/PublicLayout.jsx';
import { useSEO } from '../components/SEO.jsx';

export default function TermsPage() {
  useSEO({
    title: 'Terms of Service',
    description: 'Review the terms of service for authorized use of the MS Piparda School Management System.',
    path: '/terms-of-service',
    robots: 'index,follow'
  });

  return (
    <PublicLayout title="Terms of Service" subtitle="Rules for using the school management platform.">
      <p className="leading-7">Use is permitted only for authorized academic and administrative activities.</p>
      <p className="leading-7">
        Users must protect credentials, keep profile details accurate, and avoid unauthorized data access
        attempts.
      </p>
      <p className="leading-7">
        Violations may lead to account suspension and disciplinary action according to school policy.
      </p>
    </PublicLayout>
  );
}
