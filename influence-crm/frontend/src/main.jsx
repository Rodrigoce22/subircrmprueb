import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#201f1f',
            border: '0.5px solid rgba(65,71,85,0.3)',
            color: '#e5e2e1',
            borderRadius: '0.875rem',
            fontSize: '0.8125rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
        richColors
      />
    </QueryClientProvider>
  </ThemeProvider>
);
