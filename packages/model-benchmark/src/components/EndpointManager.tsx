import React from 'react';
import { EndpointManager as SharedEndpointManager } from '@mycircle/shared';

export default function EndpointManager() {
  return <SharedEndpointManager source="benchmark" />;
}
