import { createAddressLoader } from 'applesauce-loaders/loaders';
import { relayPool } from './relay-pool';
import { eventStore } from './eventStore';

// Create address loader
export const addressLoader = createAddressLoader(relayPool, { eventStore });
