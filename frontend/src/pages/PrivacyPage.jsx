import PublicLayout from '../components/PublicLayout.jsx';
import { useSEO } from '../components/SEO.jsx';

export default function PrivacyPage() {
  useSEO({
    title: 'Privacy Policy',
    description: 'Read the MS Piparda School Management System privacy policy for data collection, access, and protection details.',
    path: '/privacy-policy',
    robots: 'index,follow'
  });

  return (
    <PublicLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect school system data."
    >
      <p className="leading-7">
        We collect account and academic data to operate the school platform, including usernames, roles,
        classes, exams, and scores.
      </p>
      <p className="leading-7">
        Passwords are stored in hashed form, access is role-based, and records are only available to
        authorized users.
      </p>
      <p className="leading-7">
        For corrections or data access requests, contact your administrator through the support channels.
      </p>
    </PublicLayout>
  );
}
