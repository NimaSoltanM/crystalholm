import LandingPage from '@/features/landing/landing-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(landing)/')({
  component: LandingPage,
});
