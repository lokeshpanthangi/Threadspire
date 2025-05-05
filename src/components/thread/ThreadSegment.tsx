
import React from 'react';

interface Segment {
  id: string;
  content: string;
  type: string;
}

interface ThreadSegmentProps {
  segment: Segment;
  isLast: boolean;
}

const ThreadSegment = ({ segment, isLast }: ThreadSegmentProps) => {
  return (
    <div className="thread-segment relative">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>{segment.content}</p>
      </div>
      
      {/* Connector line if not the last segment */}
      {!isLast && <div className="thread-segment-connector" />}
    </div>
  );
};

export default ThreadSegment;
