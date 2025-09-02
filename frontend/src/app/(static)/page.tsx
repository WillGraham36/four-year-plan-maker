import { BentoGrid1 } from '@/components/landing/bento-grid';
import CallToAction from '@/components/landing/call-to-action';
import ContentSection from '@/components/landing/content-section';
import HeroSection from '@/components/landing/hero';
import React from 'react'

const HomePage = async () => {

  return (
    <>
      <HeroSection />
      <BentoGrid1 />
      <ContentSection />
      <CallToAction />
    </>
  );
}

export default HomePage