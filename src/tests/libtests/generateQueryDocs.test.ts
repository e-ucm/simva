import generateDocs from '@/lib/generateQueryDocs';

describe('generateQueryDocs', () => {
  it('produces markdown with view sections', () => {
    const md = generateDocs();
    expect(md).toContain('# Database View Queries');
    expect(md).toContain('## Simlet');
    expect(md).toContain('## Activity');
    expect(md).toContain('## Session');
  });
});
