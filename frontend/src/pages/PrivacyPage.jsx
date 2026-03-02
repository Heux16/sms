import PublicLayout from '../components/PublicLayout.jsx';

export default function PrivacyPage() {
  return (
    <PublicLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect school system data."
    >
      <p>
        We collect account and academic data to operate the school platform, including usernames, roles,
        classes, exams, and scores.
      </p>
      <p>
        Passwords are stored in hashed form, access is role-based, and records are only available to
        authorized users.
      </p>
      <p>
        For corrections or data access requests, contact your administrator through the support channels.
      </p>
    </PublicLayout>
  );
}
