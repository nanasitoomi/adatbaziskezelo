export default {
  root: 'supabase_frontend',
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
      interval: 100
    }
  }
}; 