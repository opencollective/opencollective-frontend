import net from 'node:net';

import { portOwner } from './ports';

describe('portOwner', () => {
  it('names the process listening on a port', async () => {
    const server = net.createServer();
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as net.AddressInfo;
    try {
      const owner = portOwner(port);
      expect(owner?.pid).toBe(process.pid);
      expect(owner?.command).toContain('node');
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('returns null when nothing listens', async () => {
    const server = net.createServer();
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as net.AddressInfo;
    await new Promise(resolve => server.close(resolve));
    expect(portOwner(port)).toBeNull();
  });
});
