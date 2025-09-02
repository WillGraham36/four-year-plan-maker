'use client';
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link'

export default function CallToAction() {
    return (
        <section className="py-16 md:py-32 md:pt-56">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Start Planning Today</h2>
                    <p className="mt-4">Join other UMD students in staying organized, saving time, and graduating with confidence</p>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <SignedOut>
                          <SignUpButton
                            mode="modal"
                            forceRedirectUrl="/account/setup"
                          >
                            <Button
                              asChild
                              size="lg"
                              className='cursor-pointer w-full max-w-48'>
                                <span>Get Started</span>
                              </Button>
                          </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                          <Button
                            asChild
                            className='cursor-pointer w-full max-w-48'
                            size="lg"
                          >
                            <Link href="/planner">
                                <span>Get Started</span>
                            </Link>
                          </Button>
                        </SignedIn>
                    </div>
                </div>
            </div>
        </section>
    )
}