import generateDocs from '@/lib/generateQueryDocs';

describe('generateQueryDocs', () => {
  it('produces markdown with view sections', () => {
    const md = generateDocs();
    expect(md).toContain('## User');
    expect(md).toContain('## Simlet');
    expect(md).toContain('## Session');
  });
});
