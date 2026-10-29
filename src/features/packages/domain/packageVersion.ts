const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function parsePackageVersion(version: string): [number, number, number] {
  if (!semverPattern.test(version)) throw new Error(`Invalid package version: ${version}`);
  const [major, minor, patch] = version.split(/[.+-]/, 3).map(Number);
  return [major, minor, patch];
}

export function comparePackageVersion(left: string, right: string) {
  const a = parsePackageVersion(left);
  const b = parsePackageVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}
