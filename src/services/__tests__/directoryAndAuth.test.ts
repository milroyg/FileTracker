import { createHash } from 'crypto';
import { buildDirectory } from '../directoryService';
import { verifyDepartmentPassword } from '../authService';

// Node's SHA-256 stands in for the native expo-crypto module.
const mockSha256 = (data: string) => createHash('sha256').update(data, 'utf8').digest('hex');
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async (_algorithm: string, data: string) => mockSha256(data)),
}));

describe('buildDirectory', () => {
  it('indexes employees by division, sorted and de-duplicated', () => {
    const directory = buildDirectory(
      'Office,Person\nD12,Zed\nD11,Carol\nD11,Anura\nD11,Anura\n"Division I (Works), Porvorim",Raj\n',
    );
    expect(directory.divisions).toEqual(['D11', 'D12', 'Division I (Works), Porvorim']);
    expect(directory.employeesByDivision.D11).toEqual(['Anura', 'Carol']);
    expect(directory.allEmployees).toEqual(['Anura', 'Carol', 'Raj', 'Zed']);
  });

  it('finds the columns by header name', () => {
    const directory = buildDirectory('Person,Office\nAnura,D11\n');
    expect(directory.employeesByDivision).toEqual({ D11: ['Anura'] });
  });

  it('throws on an empty sheet or an error page so it is never cached', () => {
    expect(() => buildDirectory('')).toThrow();
    expect(() => buildDirectory('Office,Person\n')).toThrow();
    expect(() => buildDirectory('<html><body>Sign in</body></html>')).toThrow();
  });
});

describe('verifyDepartmentPassword', () => {
  const hashOf = (password: string) =>
    createHash('sha256').update(`wrd-filetracker:v1:${password}`, 'utf8').digest('hex');

  it('accepts the password matching the configured hash', async () => {
    await expect(verifyDepartmentPassword('correct horse', hashOf('correct horse'))).resolves.toBe(
      'valid',
    );
  });

  it('rejects any other password', async () => {
    await expect(verifyDepartmentPassword('wrong', hashOf('correct horse'))).resolves.toBe(
      'invalid',
    );
  });

  it('refuses every password when no hash is configured', async () => {
    await expect(verifyDepartmentPassword('anything', '')).resolves.toBe('not_configured');
  });
});
