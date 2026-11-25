import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32, createZipBytes } from './zip';

test('crc32 matches standard IEEE 802.3 vector for "123456789"', () => {
  const bytes = new TextEncoder().encode('123456789');
  assert.equal(crc32(bytes), 0xcbf43926);
});

test('createZipBytes writes valid local headers, filenames, and EOCD signature', () => {
  const zip = createZipBytes([
    { name: 'config.toml', content: 'aprovacao_manual = false\n' },
    { name: 'README.md', content: '# livecut-en\n' }
  ]);

  // Starts with PK\x03\x04 local file header signature
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
  assert.equal(zip[2], 0x03);
  assert.equal(zip[3], 0x04);

  // Ends with EOCD signature PK\x05\x06 at length - 22
  const eocdOffset = zip.length - 22;
  assert.equal(zip[eocdOffset], 0x50);
  assert.equal(zip[eocdOffset + 1], 0x4b);
  assert.equal(zip[eocdOffset + 2], 0x05);
  assert.equal(zip[eocdOffset + 3], 0x06);

  // Contains entry count = 2 in EOCD
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  assert.equal(view.getUint16(eocdOffset + 10, true), 2);
});
