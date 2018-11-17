const santasDeRoy = require('./index');
const generateReceivers = require('./generate-receivers');
const utils = require('./utils');

jest.mock('./generate-receivers');
jest.mock('./utils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('santasDeRoy', () => {
  it('properly calls exclusionGroupsToBlacklists and generateReceivers', () => {
    utils.exclusionGroupsToBlacklists.mockReturnValue({
      anna: ['alice'],
      alice: ['anna'],
    });
    generateReceivers.generateReceivers.mockReturnValue(
      'generateReceiversReturn',
    );
    expect(
      santasDeRoy({
        history: 'history',
        blackLists: { anna: ['jo'], jo: ['alice'] },
        exclusionGroups: 'exclusionGroups',
        participants: 'participants',
        random: 'random',
      }),
    ).toBe('generateReceiversReturn');
    expect(utils.exclusionGroupsToBlacklists.mock.calls).toEqual([
      ['exclusionGroups'],
    ]);
    expect(generateReceivers.generateReceivers.mock.calls).toEqual([
      [
        {
          history: 'history',
          blackLists: { anna: ['jo', 'alice'], jo: ['alice'], alice: ['anna'] },
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
      generateReceivers.generateReceivers.mock.calls[0][0].participants.sort(),
    ).toEqual(['jo', 'anna', 'alice', 'jack'].sort());
  });

  it('can take an array as single arguments', () => {
    santasDeRoy(['bob', 'alice', 'bar', 'foo']);
    expect(
      generateReceivers.generateReceivers.mock.calls[0][0].participants,
    ).toEqual(['bob', 'alice', 'bar', 'foo']);
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
