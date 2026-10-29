import canonicalize from 'canonicalize';

export function canonicalBytes(value: unknown) {
  const serialized = canonicalize(value);
  if (!serialized) throw new Error('Unable to canonicalize package payload.');
  return Buffer.from(serialized, 'utf8');
}
