'use client'

import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../lib/store'

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return <Provider store={store}>{children}</Provider>
}
