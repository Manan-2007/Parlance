// Small uncompressed ZIP writer for local recording exports. No server upload.
const encoder = new TextEncoder()
const table = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})
function crc32(bytes) {
  let value = 0xffffffff
  for (const byte of bytes) value = table[(value ^ byte) & 255] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}
function join(parts) {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) { result.set(part, offset); offset += part.length }
  return result
}
export function packZip(files) {
  if (files.length > 65535) throw new Error('Too many export files')
  const local = [], central = [], names = new Set()
  let offset = 0
  for (const file of files) {
    if (!file.name || file.name.startsWith('/') || file.name.includes('..') || file.name.includes('\\') || names.has(file.name)) throw new Error('Invalid export filename')
    names.add(file.name)
    const name = encoder.encode(file.name), bytes = file.bytes
    if (name.length > 65535 || bytes.length > 0xffffffff) throw new Error('Export file is too large')
    const checksum = crc32(bytes)
    const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer)
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true)
    h.setUint16(12, 33, true); h.setUint32(14, checksum, true); h.setUint32(18, bytes.length, true)
    h.setUint32(22, bytes.length, true); h.setUint16(26, name.length, true); header.set(name, 30)
    local.push(header, bytes)
    const directory = new Uint8Array(46 + name.length), d = new DataView(directory.buffer)
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true)
    d.setUint16(8, 0x800, true); d.setUint16(14, 33, true); d.setUint32(16, checksum, true)
    d.setUint32(20, bytes.length, true); d.setUint32(24, bytes.length, true); d.setUint16(28, name.length, true)
    d.setUint32(42, offset, true); directory.set(name, 46); central.push(directory)
    offset += header.length + bytes.length
  }
  const directory = join(central), ending = new Uint8Array(22), end = new DataView(ending.buffer)
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true)
  end.setUint32(12, directory.length, true); end.setUint32(16, offset, true)
  return join([...local, directory, ending])
}
