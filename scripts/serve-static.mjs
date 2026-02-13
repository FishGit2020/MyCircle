import { createServer } from 'http';
import sirv from 'sirv';

const handler = sirv('dist/firebase', { single: true });
createServer(handler).listen(3000, () => {
  console.log('Static server on http://localhost:3000');
});
