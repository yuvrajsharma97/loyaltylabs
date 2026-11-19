const { calculatePoints } = require('./calculatePoints');

describe('calculatePoints', () => {
  it('awards points per pound, rounded down', () => {
    expect(calculatePoints(4.99, { mode: 'per_currency', pointsPerUnit: 1 })).toBe(4);
    expect(calculatePoints(12.5, { mode: 'per_currency', pointsPerUnit: 2 })).toBe(25);
  });

  it('awards a flat amount per visit, whatever the spend', () => {
    const program = { mode: 'per_visit', fixedPointsPerVisit: 1 };
    expect(calculatePoints(0.5, program)).toBe(1);
    expect(calculatePoints(80, program)).toBe(1);
  });

  it('never awards negative points', () => {
    expect(calculatePoints(-10, { mode: 'per_currency', pointsPerUnit: 1 })).toBe(0);
  });
});

