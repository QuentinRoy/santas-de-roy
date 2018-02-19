const santasDeRoy = require('./index');
const generateSantas = require('./generate-santas');
const utils = require('./utils');

jest.mock('./generate-santas');
jest.mock('./utils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('santasDeRoy', () => {
  it('proparly calls exclusionGroupsToBlacklists and generateSantas', () => {
    utils.exclusionGroupsToBlacklists.mockReturnValue({
      anna: ['alice'],
      alice: ['anna'],
    });
    generateSantas.generateSantas.mockReturnValue('generateSantasReturn');
    expect(
      santasDeRoy({
        history: 'history',
        blackLists: { anna: ['jo'], jo: ['alice'] },
        exclusionGroups: 'exclusionGroups',
        participants: 'participants',
        random: 'random',
      }),
    ).toBe('generateSantasReturn');
    expect(utils.exclusionGroupsToBlacklists.mock.calls).toEqual([
      ['exclusionGroups'],
    ]);
    expect(generateSantas.generateSantas.mock.calls).toEqual([
      [
        {
          history: 'history',
          blackLists: { anna: ['alice', 'jo'], jo: ['alice'], alice: ['anna'] },
          participants: 'participants',
          random: 'random',
        },
      ],
    ]);
  });

  it('elicits participants from blackLists and exclusionGroups if they are not provided', () => {
    santasDeRoy({
      blackLists: { anna: ['jo'], jo: ['alice'] },
      exclusionGroups: [['anna', 'alice'], ['jo', 'jack']],
    });
    expect(
      generateSantas.generateSantas.mock.calls[0][0].participants.sort(),
    ).toEqual(['jo', 'anna', 'alice', 'jack'].sort());
  });

  it('can take an array as single arguments', () => {
    santasDeRoy(['bob', 'alice', 'bar', 'foo']);
    expect(generateSantas.generateSantas.mock.calls[0][0].participants).toEqual(
      ['bob', 'alice', 'bar', 'foo'],
    );
  });

  it('throws if there is no possible participants', () => {
    expect(() => {
      santasDeRoy({});
    }).toThrowError('No participants specified.');
    expect(() => {
      santasDeRoy();
    }).toThrowError('No participants specified.');
    expect(() => {
      santasDeRoy([]);
    }).toThrowError('No participants specified.');
    expect(() => {
      santasDeRoy({ participant: [] });
    }).toThrowError('No participants specified.');
  });
});
