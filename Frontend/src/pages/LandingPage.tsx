import React, { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { AboutSection } from '../components/landing/AboutSection';
import { RolesSection } from '../components/landing/RolesSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { GallerySection } from '../components/landing/GallerySection';
import { RegistrationSection } from '../components/landing/RegistrationSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CareersSection } from '../components/landing/CareersSection';
import { CtaSection } from '../components/landing/CtaSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    // Scroll to top upon initial mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page-root">
      {/* Navigation Header with transparent-to-solid transitions */}
      <Navbar />

      {/* 1. Hero Section (Near 100svh Immersive Campus Photo) */}
      <HeroSection />

      {/* 2. Introducing EduHub */}
      <AboutSection />

      {/* 3. Who EduHub Connects (Three User Roles) */}
      <RolesSection />

      {/* 4. Platform Benefits */}
      <BenefitsSection />

      {/* 5. School Life Editorial Gallery */}
      <GallerySection />

      {/* 6. How Registration Works */}
      <RegistrationSection />

      {/* 7. Parent Stories & Community Feedback */}
      <TestimonialsSection />

      {/* 8. Careers & Faculty Spotlight */}
      <CareersSection />

      {/* 9. Final Call To Action */}
      <CtaSection />

      {/* 10. Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
