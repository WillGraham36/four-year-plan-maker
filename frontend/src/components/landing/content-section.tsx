import { Computer, Cpu, Zap } from 'lucide-react'
import Image from 'next/image'

export default function ContentSection() {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-6xl space-y-8 max-md:px-6 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">Visualize your progress</h2>
                <div className="relative">
                    <div className="relative z-10 space-y-4 md:w-1/2">
                        <p>
                            Get a clear snapshot of exactly which gen eds, credits, and CS requirements you've finished, and what's still left
                        </p>
                        <p>It supports all CS tracks, upper level concentrations, and more. It actively reflects your progress, including what classes you finished and what you plan to take</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Computer className="size-4" />
                                    <h3 className="text-sm font-medium">CS focused, for everyone</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">This site is aimed to help CS majors, but all majors will find use from it</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Faster planning</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Auto completes gen eds and credits for each course, tracking your total requirements in real time</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 h-fit md:absolute md:-inset-y-12 md:inset-x-0 md:mt-0">
                        <div
                            aria-hidden
                            className="bg-linear-to-l z-1 to-background absolute inset-0 hidden from-transparent to-55% md:block"></div>
                        <div className="border-border/50 relative rounded-2xl border border-dotted p-2">
                            <Image
                              src="/images/charts2.png"
                              className="rounded-[12px] hidden md:block"
                              alt="Audit section charts"
                              width={1207}
                              height={929}
                            />
                            <Image
                              src="/images/charts1.png"
                              className="rounded-[12px] block md:hidden"
                              alt="Audit section charts"
                              width={1207}
                              height={929}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}