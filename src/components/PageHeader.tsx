'use client';

import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import HelpButton from './HelpButton';
import { usePageHeader } from '@/contexts/PageHeaderContext';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  showHelp?: boolean;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  showHelp = true, 
  rightElement,
  children 
}: PageHeaderProps) {
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader({ title, description: description || children, showHelp, rightElement });
  }, [title, description, showHelp, rightElement, children, setPageHeader]);

  return null;
}
















