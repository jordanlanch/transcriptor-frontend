'use client';

import { logout } from '@/lib/api';

export default function LogoutButton() {
  const handleLogout = () => {
    document.cookie = 'transcriptor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    logout();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      Logout
    </button>
  );
}
