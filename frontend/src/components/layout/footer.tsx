import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Footer = () => {
  return (
    <footer className='w-full h-20 flex flex-col items-center justify-center gap-1'>
      <div className='flex items-center justify-center space-x-2'>
        <Link href="https://www.linkedin.com/in/will-graham-4623022a8/" target="_blank">
          <IconWithLightMode
            icon="/icons/linkedin-icon"
            alt="LinkedIn"
            width={32}
            height={32}
          />
        </Link>
        <Link href="https://github.com/WillGraham36/" target="_blank">
          <IconWithLightMode
            icon="/icons/github-icon"
            alt="GitHub"
            width={32}
            height={32}
          />
        </Link>
        <Link href="mailto:wgraham1@umd.edu" target="_blank">
          <IconWithLightMode
            icon="/icons/email-icon"
            alt="Email"
            width={32}
            height={32}
          />
        </Link>
      </div>
      <div className='text-sm text-muted-foreground flex items-center justify-center space-x-2'>
        <p>
          &copy; {new Date().getFullYear()} TerpPlanner
        </p>
        <Link href="/privacy-policy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className="hover:underline">
          Terms of Service
        </Link>
      </div>
    </footer>
  )
}

export const IconWithLightMode = ({
  icon,
  alt,
  width,
  height
}: {
  icon: string;
  alt: string;
  width: number;
  height: number;
}) => {
  return (
    <>
      <Image
        src={`${icon}.svg`}
        alt={alt}
        width={width}
        height={height}
        className='hidden dark:block'
      />
      <Image
        src={`${icon}-light.svg`}
        alt={alt}
        width={width}
        height={height}
        className='block dark:hidden'
      />
    </>
  )
}

export default Footer