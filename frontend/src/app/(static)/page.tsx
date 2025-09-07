'use client';
import { BentoGrid1 } from '@/components/landing/bento-grid';
import CallToAction from '@/components/landing/call-to-action';
import ContentSection from '@/components/landing/content-section';
import HeroSection from '@/components/landing/hero';
import React, { useEffect } from 'react'

const HomePage = () => {
  
useEffect(() => {
  const pingBackend = async () => {
    const start = performance.now();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/ping`, {
        method: "GET",
        cache: "no-store", // avoid cached responses
      });
      const end = performance.now();
      console.log(`Ping successful in ${(end - start).toFixed(2)} ms`);
    } catch (err) {
      const end = performance.now();
      console.log(`Ping failed after ${(end - start).toFixed(2)} ms`, err);
    }
  };

  pingBackend();
}, []);


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