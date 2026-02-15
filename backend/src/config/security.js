module.exports = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    accessTTL: parseInt(process.env.JWT_ACCESS_TTL_SECONDS) || 900,
    refreshTTL: parseInt(process.env.JWT_REFRESH_TTL_SECONDS) || 2592000
  },
  bcrypt: {
    saltRounds: 10
  }
};
