
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ThreadReader from '@/components/thread/ThreadReader';
import RelatedThreads from '@/components/discovery/RelatedThreads';

const ThreadPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        {threadId && <ThreadReader threadId={threadId} />}
        <div className="mt-12">
          <h2 className="text-2xl font-playfair font-medium mb-6">Related Threads</h2>
          {threadId && <RelatedThreads threadId={threadId} tags={[]} />}
        </div>
      </div>
    </Layout>
  );
};

export default ThreadPage;
