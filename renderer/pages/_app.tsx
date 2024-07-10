import React from 'react'
import type { AppProps } from 'next/app'

import '../styles/globals.css'
import { Toaster } from '@/components/ui/toaster'

function MyApp({ Component, pageProps }: AppProps) {
  return <>
    <Component {...pageProps}  /> 
    <Toaster />
  </>
}

export default MyApp
