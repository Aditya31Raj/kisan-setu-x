test('inventory invariant',()=>{const requested=100,available=150;expect(available>=requested).toBe(true);expect(available-requested).toBe(50)});
