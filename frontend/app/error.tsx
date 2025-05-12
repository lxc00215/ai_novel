'use client'

import React from 'react';

export default function GlobalError({ error }: { error: Error }) {
  React.useEffect(() => {
    // 忽略非关键性错误
    if (error.message.includes('NEXT_HTTP_ERROR_FALLBACK')) {
      return;
    }
    console.error('全局错误:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong!</h2>
        </div>
      </body>
    </html>
  );
}