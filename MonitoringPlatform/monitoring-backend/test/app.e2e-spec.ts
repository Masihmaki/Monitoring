/**
 * Full AppModule e2e needs a running Postgres and valid env.
 * Prefer unit tests under src/**/*.spec.ts for CI-friendly coverage.
 */
describe('monitoring-backend e2e placeholder', () => {
  it('documents that integration tests require dockerized Postgres', () => {
    expect(process.env.DB_HOST ?? 'localhost').toBeTruthy();
  });
});
