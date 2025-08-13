import AuthPage from '@/features/auth/components/auth-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/')({
  component: AuthPage,
});
