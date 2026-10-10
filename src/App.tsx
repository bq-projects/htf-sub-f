import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { RouterProvider, useRouter } from '@/contexts/RouterContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { FullPageLoader } from '@/components/ui';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PricingPage } from '@/pages/PricingPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { AIChatPage } from '@/pages/AIChatPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { MyAgentPage } from '@/pages/MyAgentPage';
import { MarketingStudioPage } from '@/pages/MarketingStudioPage';
import { AdCreativePage } from '@/pages/AdCreativePage';
import { EventStudioPage } from '@/pages/EventStudioPage';
import { VoiceoverPage } from '@/pages/VoiceoverPage';
import { CampaignHistoryPage } from '@/pages/CampaignHistoryPage';
import { SubscriptionPage } from '@/pages/SubscriptionPage';
import { BusinessSettingsPage } from '@/pages/BusinessSettingsPage';
import { ProfileSettingsPage } from '@/pages/ProfileSettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { useEffect } from 'react';

function Routes() {
  const { path } = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = 'BizAgent OS — Your Business. Your AI Team.';
  }, []);

  if (loading) return <FullPageLoader />;

  // Admin route - no auth required, has own login
  if (path === '/sadmin') return <AdminPage />;

  // Public routes
  if (path === '/' || path === '') return <LandingPage />;
  if (path === '/login') return <LoginPage />;
  if (path === '/register') return <RegisterPage />;
  if (path === '/pricing') return <PricingPage />;

  // Protected routes
  if (!user) {
    return <LoginPage />;
  }

  if (path === '/onboarding') return <OnboardingPage />;

  // App routes (wrapped in layout)
  const appRoutes: Record<string, React.ComponentType> = {
    '/dashboard': DashboardPage,
    '/chat': AIChatPage,
    '/knowledge': KnowledgeBasePage,
    '/agent': MyAgentPage,
    '/marketing': MarketingStudioPage,
    '/ad-creative': AdCreativePage,
    '/event-studio': EventStudioPage,
    '/voiceover': VoiceoverPage,
    '/campaigns': CampaignHistoryPage,
    '/subscription': SubscriptionPage,
    '/business-settings': BusinessSettingsPage,
    '/profile-settings': ProfileSettingsPage,
  };

  const AppComponent = appRoutes[path];
  if (AppComponent) {
    return (
      <AppLayout>
        <AppComponent />
      </AppLayout>
    );
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <BusinessProvider>
          <ToastProvider>
            <Routes />
          </ToastProvider>
        </BusinessProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
