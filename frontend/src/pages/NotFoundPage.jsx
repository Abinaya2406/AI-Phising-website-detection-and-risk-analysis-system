import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4 shadow-danger-glow">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-white font-mono tracking-wider">
        404 <span className="text-red-400">ACCESS_DENIED</span>
      </h1>
      <p className="text-sm text-cyber-muted max-w-sm mt-2 mb-6">
        The requested security matrix route does not exist or has been quarantined.
      </p>
      <Link to="/">
        <Button variant="primary" icon={ArrowLeft}>
          Return to Threat Scanner
        </Button>
      </Link>
    </div>
  );
}

