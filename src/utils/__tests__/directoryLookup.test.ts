import { findEmployeeInDivision } from '../directoryLookup';
import type { DirectoryData } from '../../services/directoryService';

const directory: DirectoryData = {
  divisions: ['D11-Acct', 'Division I (Works), Porvorim'],
  employeesByDivision: {
    'D11-Acct': ['Anura', 'Blasia Fernandes'],
    'Division I (Works), Porvorim': ['Raj'],
  },
  allEmployees: ['Anura', 'Blasia Fernandes', 'Raj'],
};

describe('findEmployeeInDivision', () => {
  it('returns the name as written in the directory', () => {
    expect(findEmployeeInDivision(directory, 'D11-Acct', 'Anura')).toBe('Anura');
  });

  it('ignores case and extra spaces', () => {
    expect(findEmployeeInDivision(directory, ' d11-acct ', '  blasia   FERNANDES ')).toBe(
      'Blasia Fernandes',
    );
  });

  it('rejects a name that is not in the directory', () => {
    expect(findEmployeeInDivision(directory, 'D11-Acct', 'Random Person')).toBeNull();
  });

  it('rejects a real person under the wrong division', () => {
    expect(findEmployeeInDivision(directory, 'D11-Acct', 'Raj')).toBeNull();
  });

  it('rejects an unknown division', () => {
    expect(findEmployeeInDivision(directory, 'Head Office', 'Anura')).toBeNull();
  });
});
