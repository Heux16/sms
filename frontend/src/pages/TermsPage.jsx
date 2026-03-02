import PublicLayout from '../components/PublicLayout.jsx';

export default function TermsPage() {
  return (
    <PublicLayout title="Terms of Service" subtitle="Rules for using the school management platform.">
      <p>Use is permitted only for authorized academic and administrative activities.</p>
      <p>
        Users must protect credentials, keep profile details accurate, and avoid unauthorized data access
        attempts.
      </p>
      <p>
        Violations may lead to account suspension and disciplinary action according to school policy.
      </p>
    </PublicLayout>
  );
}
