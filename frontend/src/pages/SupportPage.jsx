import PublicLayout from '../components/PublicLayout.jsx';

export default function SupportPage() {
  return (
    <PublicLayout title="Support" subtitle="Quick help for login, grades, and technical issues.">
      <ul>
        <li>Login issues: verify username/password and contact admin for reset.</li>
        <li>Grade issues: confirm exam/test publication and check with your teacher.</li>
        <li>Technical issues: refresh, clear cache, or try a different browser.</li>
      </ul>
      <p>If problems continue, use the contact page and include your role and username.</p>
    </PublicLayout>
  );
}
