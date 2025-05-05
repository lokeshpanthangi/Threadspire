
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CollectionDetail from '@/components/collections/CollectionDetail';

const CollectionPage = () => {
  const { collectionId } = useParams();
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <CollectionDetail collectionId={collectionId} />
      </div>
    </Layout>
  );
};

export default CollectionPage;
